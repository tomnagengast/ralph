#!/bin/bash
set -euo pipefail

export project="$(cd "$(git rev-parse --show-toplevel)" &>/dev/null && pwd)"
export ralph="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

# Parse flags
run_id=""
start_mode=""
while [[ $# -gt 0 ]]; do
  case "$1" in
  --review)
    # Alias for starting with the reviewer
    start_mode="reviewer"
    shift
    ;;
  --start)
    start_mode="${2:-}"
    shift 2
    ;;
  *)
    # First non-flag arg is the run id
    if [ -z "$run_id" ]; then
      run_id="$1"
    fi
    shift
    ;;
  esac
done

if [ -n "$start_mode" ]; then
  export RALPH_START_MODE="$start_mode"
fi

if [ -z "$run_id" ]; then
  runs=$(find $ralph -maxdepth 1 -type d -name 'run-*' -exec basename {} \; | sort)
  run_id=$( (
    echo "Setup a new run"
    echo "$runs"
  ) | gum choose)
fi

if [ "$run_id" == "Setup a new run" ]; then
  run_id="run-$(date +%Y-%m-%d-%H%M)"
fi

setup_exit_code="${RALPH_BASE_EXIT_CODE:-64}"
done_exit_code="${RALPH_DONE_EXIT_CODE:-65}"
export RALPH_BASE_EXIT_CODE="$setup_exit_code"
export RALPH_DONE_EXIT_CODE="$done_exit_code"

function update_run_status() {
  local new_status="${1:-}"
  local state_path="$ralph/state.json"

  [ -n "$run_id" ] || return 0
  [ -f "$state_path" ] || return 0

  if ! jq -e --arg run_id "$run_id" 'any(.[]; .id == $run_id)' "$state_path" >/dev/null; then
    return 0
  fi

  local tmp_state
  tmp_state=$(mktemp)
  if jq --arg run_id "$run_id" --arg status "$new_status" \
    'map(if .id == $run_id then .status = $status else . end)' \
    "$state_path" >"$tmp_state"; then
    mv "$tmp_state" "$state_path"
  else
    rm -f "$tmp_state"
  fi
}

trap 'update_run_status "inactive"' EXIT

msg=(
  "I choo choo choose you."
  "My cat’s breath smells like cat food."
  "I’m in danger!"
  "Me fail English? That’s unpossible."
  "My spoon is too big for my ice cream."
  "That’s where I saw the leprechaun. He told me to burn things."
  "I bent my wookie."
  "Miss Hoover, my worm crawled in my mouth and gave me a tummy ache."
  "The doctor said I wouldn’t have so many nosebleeds if I kept my finger outta there."
  "I ated the purple berries. They taste like burning."
  "When I grow up, I want to be a principal or a caterpillar."
  "Hi Super Nintendo Chalmers."
  "I had a dream where I was a Viking."
  "Hi Lisa. Hi Lisa’s mom. Hi Lisa’s dad. Hi Lisa’s..."
  "I made a mud pie."
  "My pants are chafing me."
  "It tastes like grandma."
  "This is my sandbox. I’m not allowed in the deep end."
  "I found a moon rock in my nose."
  "I glued my head to my shoulder."
  "That’s my sandbox. I was eating the sand."
  "I want to go home."
  "I think I’m allergic to my own tears."
  "Look, I’m a unitard."
  "I dress myself."
  "This snowflake tastes like fish sticks."
  "Teacher, my homework ate my dog."
  "I beat the smart kids. I beat them."
  "That’s a paddlin."
  "I’m a brick."
  "My belly hurts but my heart is happy."
  "I drank blue juice. It is not poison."
  "Ow, my face is on fire."
  "I peeled my arm like a banana."
  "The vacuum cleaner ate my sweater."
  "I can’t put my arms down."
  "I’m a popsicle."
  "I sleep in a drawer."
  "Hi Principal Skinner. Hi Superintendent Chalmers. Hi..."
  "I found a stick. It’s my friend."
  "I’m helping."
  "I colored outside the lines and that’s where the magic happens."
  "I have two goldfish. They live in my tummy."
  "I saw a baby and it looked at me."
  "My tummy makes a funny whirring noise."
  "I ate the food that said do not eat."
  "I lied and said I was the last donut."
  "I touched a power line and now I smell toast."
  "The leprechaun tells me to burn things."
  "My elbow is talking again."
  "I put a bandaid on my tongue and now it won’t come off."
  "I named my dog Santa’s Little Helper’s Helper."
  "My crayon tastes like purple."
  "Look at me, I’m a big boy."
  "My neck is itchy. It might be bees."
  "I don’t like my new pants. They have opinions."
  "I brought my own milk. It’s warm."
)
term_width=$(tput cols)
gum style \
  --foreground 227 --border-foreground 220 \
  --border rounded --width=$((term_width * 90 / 100)) --padding "0 1" \
  --align center \
  "${msg[$((RANDOM % ${#msg[@]}))]}" "Running $run_id"

if [ -d "$ralph/$run_id" ]; then
  update_run_status "active"
fi

loop=1
while :; do
  echo "$(date +%Y-%m-%d\ %I:%M:%S\ %p) {{ Bold (Color \"0\" \"220\" \" ($loop) Starting Loop \") }} {{ Color \"227\" \"0\" \"$run_id\" }}{{ printf \"\n\" }}" |
    gum format -t template

  status=0
  bash $ralph/turn.sh "$run_id" "$loop" || status=$?
  if [ "$status" -ne 0 ]; then
    if [ "$status" -eq "$setup_exit_code" ]; then
      exit 0
    fi
    if [ "$status" -eq "$done_exit_code" ]; then
      echo "$(date +%Y-%m-%d\ %I:%M:%S\ %p) {{ Bold (Color \"0\" \"220\" \" ($loop) All done \") }} {{ Color \"227\" \"0\" \"$run_id\" }}{{ printf \"\n\" }}" |
        gum format -t template
      exit 0
    fi
    exit "$status"
  fi

  echo "$(date +%Y-%m-%d\ %I:%M:%S\ %p) {{ Bold (Color \"0\" \"220\" \" ($loop) Finished Loop \") }} {{ Color \"227\" \"0\" \"$run_id\" }}{{ printf \"\n\" }}" |
    gum format -t template
  loop=$((loop + 1))
  # [ "$(date +%H%M)" -ge 0030 ] && [ "$(date +%H)" -eq 0 ] && exit 0 # close up shop if its after 12:30AM
  sleep 10
done
