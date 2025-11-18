#!/bin/bash
set -eo pipefail

# exit 0 # Leave for manual testing

run_id="${1:-}"
loop="${2:-}"

if [ -z "$run_id" ]; then
  echo "No run ID provided"
  exit 1
fi

setup_exit_code="${RALPH_SETUP_EXIT_CODE:-64}"
done_exit_code="${RALPH_DONE_EXIT_CODE:-65}" # Signals the loop controller to stop

export root="$(cd "$(git rev-parse --show-toplevel)" &>/dev/null && pwd)"
# export root="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
pushd "$root" >/dev/null || exit 1
trap 'popd >/dev/null' EXIT

run_path=".ralph/$run_id"

function cursor_builder() {
  # Thanks https://github.com/johnlindquist/cursor-alias
  A_MARKDOWN=1 \
    A_LOG_FILE="$run_path/logs/composer-$(date +%Y-%m-%d-%H%M).md" \
    a --force "$(<$run_path/builder.md)"
}

function codex_reviewer() {
  review_path="$run_path/logs/review-$(date +%Y-%m-%d-%H%M).json"

  command codex --yolo exec --skip-git-repo-check \
    --output-schema .ralph/review-schema.json \
    --output-last-message "$review_path" \
    "$(<$run_path/reviewer.md)"

  # Update the run's last_commit and last_review in .ralph/state.json
  local tmp_state
  tmp_state=$(mktemp)
  jq --arg run_id "$run_id" \
    --arg commit "$(git rev-parse HEAD)" \
    --arg review_path "$review_path" \
    'map(if .id == $run_id then .last_commit = $commit | .last_review = $review_path else . end)' \
    .ralph/state.json >"$tmp_state"
  mv "$tmp_state" .ralph/state.json
}

# NOTE: testing, leave commented out for now
# function claude_builder() {
#   command claude -p --output-format=stream-json --verbose --dangerously-skip-permissions "$(<$run_path/builder.md)" |
#     tee -a $run_path/logs/claude-$(date +%Y-%m-%d-%H%M).jsonl |
#     npx repomirror visualize --debug
#   # add json_schema output?
# }

function setup() {
  if [ ! -d "$run_path" ]; then
    [ -f .ralph/state.json ] || echo "[]" >.ralph/state.json
    cp -r ".ralph/.template" "$run_path"
    bun -e "
    const f = await Bun.file('.ralph/state.json').json();
    f.push({
      id: '${run_id}',
      status: 'inactive',
      path: '${run_path}',
      last_commit: '$(git rev-parse HEAD)',
      last_review: ''
    });
    await Bun.write('.ralph/state.json', JSON.stringify(f, null, 2));
    "

    gum format -- "# New Run Setup Complete" "- Created $run_path" "- Added to .ralph/state.json"

    exit "$setup_exit_code"
  fi
}

function git_sync() {
  if [ -n "${RALPH_VERBOSE_GIT_SYNC:-}" ]; then
    GIT_ADVICE_SKIPPED_CHERRY_PICKS=false git rebase --autostash origin/main
    return
  fi

  local output
  if ! output=$(GIT_ADVICE_SKIPPED_CHERRY_PICKS=false git rebase --autostash origin/main 2>&1); then
    echo "$output" >&2
    return 1
  fi
}

function run_builder() {
  echo "$(date +%Y-%m-%d\ %I:%M:%S\ %p) {{ Bold (Color \"0\" \"212\" \" ($loop) Running Builder \") }} {{ Color \"212\" \"0\" \"Cursor\" }}{{ printf \"\n\" }}" |
    gum format -t template
  cursor_builder
}

function run_reviewer() {
  echo "$(date +%Y-%m-%d\ %I:%M:%S\ %p) {{ Bold (Color \"0\" \"42\" \" ($loop) Running Reviewer \") }} {{ Color \"42\" \"0\" \"Codex\" }}{{ printf \"\n\" }}" |
    gum format -t template
  echo ""
  codex_reviewer
}

function check_status() {
  local state_last_review
  local last_review
  local status

  state_last_review=$(jq -r --arg run_id "$run_id" '.[] | select(.id == $run_id) | .last_review // empty' .ralph/state.json)
  last_review="$state_last_review"

  if [ -z "$last_review" ] && [ -d "$run_path/logs" ] && compgen -G "$run_path/logs/review-*.json" >/dev/null; then
    last_review=$(ls -t "$run_path"/logs/review-*.json | head -n 1)
  fi

  if [ -z "$last_review" ]; then
    echo "No last review found"
    return 0
  fi

  status=$(jq -r '.status // empty' "$last_review")
  if [ "$status" == "ok" ]; then
    echo "Done! Exiting..."
    exit "$done_exit_code"
  fi

  echo "Continuing... 🚀"
}

function main() {
  setup
  git_sync
  local start_mode="${RALPH_START_MODE:-}"
  # Skip the builder only on the very first reviewer-first loop (-review flag)
  if [ "$loop" -ne 1 ] || [ "$start_mode" != "reviewer" ]; then
    run_builder
  fi
  run_reviewer
  check_status
}

main
