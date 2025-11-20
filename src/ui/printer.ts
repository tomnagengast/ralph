import boxen from "boxen";
import chalk from "chalk";

export function hi(title: string, message: string = "") {
  const dateStr = new Date().toISOString();
  const runInfo = chalk.bgHex("#FFD700").hex("#000000").bold(title);
  const messageInfo = chalk.hex("#FFFF00").bold(message);
  console.log(`${dateStr} ${runInfo} ${messageInfo}\n`);
}

export function step(role: "Builder" | "Reviewer", agent: string, loop: number) {
  const date = new Date();
  const timeStr = date.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dStr = date.toISOString().split("T")[0];
  const displayDate = `${dStr} ${timeStr}`;

  let loopInfo: string;
  let agentInfo: string;

  if (role === "Builder") {
    loopInfo = chalk.bgHex("#FF00AF").hex("#000000").bold(` (${loop}) Running Builder `);
    agentInfo = chalk.hex("#FF00AF")(agent);
  } else {
    loopInfo = chalk.bgHex("#00FF00").hex("#000000").bold(` (${loop}) Running Reviewer `);
    agentInfo = chalk.hex("#00FF00")(agent);
  }
  console.log(`${displayDate} ${loopInfo} ${agentInfo}\n`);
}

export async function banner(runId: string) {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const termWidth = process.stdout.columns || 80;
  const width = Math.floor(termWidth * 0.9);

  console.log(
    boxen(`${quote}\nRunning ${runId}`, {
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      margin: 0,
      borderStyle: "round",
      borderColor: "yellow", // Closest approximation to 220
      width: width,
      textAlignment: "center",
      title: "", // Optional
    }),
  );
}

const quotes = [
  "I choo choo choose you.",
  "My cat’s breath smells like cat food.",
  "I’m in danger!",
  "Me fail English? That’s unpossible.",
  "My spoon is too big for my ice cream.",
  "That’s where I saw the leprechaun. He told me to burn things.",
  "I bent my wookie.",
  "Miss Hoover, my worm crawled in my mouth and gave me a tummy ache.",
  "The doctor said I wouldn’t have so many nosebleeds if I kept my finger outta there.",
  "I ated the purple berries. They taste like burning.",
  "When I grow up, I want to be a principal or a caterpillar.",
  "Hi Super Nintendo Chalmers.",
  "I had a dream where I was a Viking.",
  "Hi Lisa. Hi Lisa’s mom. Hi Lisa’s dad. Hi Lisa’s...",
  "I made a mud pie.",
  "My pants are chafing me.",
  "It tastes like grandma.",
  "This is my sandbox. I’m not allowed in the deep end.",
  "I found a moon rock in my nose.",
  "I glued my head to my shoulder.",
  "That’s my sandbox. I was eating the sand.",
  "I want to go home.",
  "I think I’m allergic to my own tears.",
  "Look, I’m a unitard.",
  "I dress myself.",
  "This snowflake tastes like fish sticks.",
  "Teacher, my homework ate my dog.",
  "I beat the smart kids. I beat them.",
  "That’s a paddlin.",
  "I’m a brick.",
  "My belly hurts but my heart is happy.",
  "I drank blue juice. It is not poison.",
  "Ow, my face is on fire.",
  "I peeled my arm like a banana.",
  "The vacuum cleaner ate my sweater.",
  "I can’t put my arms down.",
  "I’m a popsicle.",
  "I sleep in a drawer.",
  "Hi Principal Skinner. Hi Superintendent Chalmers. Hi...",
  "I found a stick. It’s my friend.",
  "I’m helping.",
  "I colored outside the lines and that’s where the magic happens.",
  "I have two goldfish. They live in my tummy.",
  "I saw a baby and it looked at me.",
  "My tummy makes a funny whirring noise.",
  "I ate the food that said do not eat.",
  "I lied and said I was the last donut.",
  "I touched a power line and now I smell toast.",
  "The leprechaun tells me to burn things.",
  "My elbow is talking again.",
  "I put a bandaid on my tongue and now it won’t come off.",
  "I named my dog Santa’s Little Helper’s Helper.",
  "My crayon tastes like purple.",
  "Look at me, I’m a big boy.",
  "My neck is itchy. It might be bees.",
  "I don’t like my new pants. They have opinions.",
  "I brought my own milk. It’s warm.",
];
