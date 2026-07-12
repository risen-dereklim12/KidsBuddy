export interface BotResponse {
  text: string;
  expression: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy';
  suggestions?: string[];
}

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything! ⚛️🤪",
  "What do you call a dinosaur that is a noisy sleeper? A Tyranno-snore-us! 🦖💤",
  "Why did the math book look sad? Because it had too many problems! 📘😢",
  "What do you call an alligator in a vest? An investigator! 🐊🔍",
  "Why did the banana go to the doctor? Because it wasn't peeling well! 🍌🩺",
  "What do you call a sleeping bull? A bulldozer! 🐂💤"
];

const FACTS = [
  "Did you know that honey never spoils? You could eat honey that is 3,000 years old! 🍯🐝",
  "Bananas are actually berries, but strawberries are not! 🍌🍓 Mind-blowing, right?",
  "A day on Venus is longer than a whole year on Venus! 🌌🪐",
  "Octopuses have three hearts and blue blood! 🐙💙",
  "Sea otters hold hands when they sleep so they don't float away! 🦦💤",
  "Wombat poop is shaped like cubes! This stops it from rolling away! 💩📦"
];

const STORIES = [
  "Once upon a time, there was a tiny dragon named Pippin who couldn't breathe fire. Instead, Pippin breathed colorful bubbles! 🐉🫧 The other dragons laughed, but Pippin used his bubble breath to throw the best birthday parties in the kingdom! 🎉🏰 Eventually, he became the Chief Bubble Officer of the Castle!",
  "In a forest of candy trees, a little squirrel named Pip lost his golden acorn. 🌲🍬 He asked Oliver the Owl for help. Oliver said, 'Look where the sun tickles the strawberry bushes!' Pip ran there and found it inside a giant marshmallow flower! Oliver and Pip shared a candy picnic! 🐿️🦉✨",
  "Luna the space pup went on a mission to find the Moon Cheese. 🐶🚀 She flew in a rocket made of stardust and landed on a glowing yellow crater. When she took a bite, it tasted like chocolate chip cookies! She packed three jars of Moon Dust cookies to share with her friends on Earth!"
];

const GAMES = [
  "Let's play a guessing game! 🎮 I am thinking of an animal. It is very big, has a long nose called a trunk, and large floppy ears. What am I? (Type your guess!)",
  "Let's play Trivia! 🧠 Question: How many legs does a spider have? (Type your answer!)",
  "Let's play Rock-Paper-Scissors! ✊✋✌️ I choose... Dino-Claw! Haha, just kidding. Type 'Rock', 'Paper', or 'Scissors' to play!"
];

// Helper to filter bad words or negative inputs gently
const INAPPROPRIATE_WORDS = [
  "hate", "stupid", "idiot", "dumb", "ugly", "shut up", "kill", "bad", "poophead", "garbage"
];

export function getBotResponse(userInput: string, history: any[] = []): Promise<BotResponse> {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: userInput,
      history: history.map(h => ({
        id: h.id,
        sender: h.sender,
        text: h.text,
        timestamp: h.timestamp ? (h.timestamp instanceof Date ? h.timestamp.toISOString() : new Date(h.timestamp).toISOString()) : undefined
      }))
    })
  })
  .then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    return res.json() as Promise<BotResponse>;
  })
  .catch((err) => {
    console.warn("FastAPI backend connection failed. Falling back to local mock bot engine.", err);
    
    // Original local simulation logic:
    return new Promise<BotResponse>((resolve) => {
      setTimeout(() => {
        const lowerInput = userInput.trim().toLowerCase();

        // Check for empty input
        if (!lowerInput) {
          resolve({
            text: "Hello! Did you want to say something? Press the microphone or type below! 🦕✨",
            expression: "happy",
            suggestions: ["Tell me a joke! 🤪", "Tell me a story 📖"]
          });
          return;
        }

        // Safe Word Filter check
        const containsInappropriate = INAPPROPRIATE_WORDS.some(word => lowerInput.includes(word));
        if (containsInappropriate) {
          resolve({
            text: "Oops! Let's try using happy, friendly words! Buddy loves kindness! 🦕💖 Can we talk about something fun instead?",
            expression: "idle",
            suggestions: ["Animal facts 🦁", "Tell me a joke! 🤪", "Let's play a game 🎮"]
          });
          return;
        }

        // Greetings
        if (["hello", "hi", "hey", "hola", "greetings", "buddy", "dino"].some(greet => lowerInput.includes(greet))) {
          resolve({
            text: "Hi there, friend! 🦕 I'm Buddy, your chat buddy! What fun adventure are we going on today?",
            expression: "happy",
            suggestions: ["Tell me a joke! 🤪", "Tell me a story 📖", "Let's play a game 🎮"]
          });
          return;
        }

        // Joke request
        if (lowerInput.includes("joke") || lowerInput.includes("funny") || lowerInput.includes("laugh")) {
          const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
          resolve({
            text: `Here is a funny one for you:\n\n${joke}`,
            expression: "happy",
            suggestions: ["Another joke! 😂", "Tell me a fact 🧐", "Let's play a game 🎮"]
          });
          return;
        }

        // Fact request
        if (lowerInput.includes("fact") || lowerInput.includes("science") || lowerInput.includes("learn") || lowerInput.includes("why is")) {
          const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
          resolve({
            text: `Wow, science is cool! Check this out:\n\n${fact}`,
            expression: "happy",
            suggestions: ["Tell me a story 📖", "Play a game 🎮", "Another fact! 💡"]
          });
          return;
        }

        // Story request
        if (lowerInput.includes("story") || lowerInput.includes("tale") || lowerInput.includes("dragon") || lowerInput.includes("read")) {
          const story = STORIES[Math.floor(Math.random() * STORIES.length)];
          resolve({
            text: `Grab your blanket! Here is a mini story:\n\n${story}\n\nHope you liked it! 📖💖`,
            expression: "happy",
            suggestions: ["Another story! 🐉", "Tell me a joke! 🤪", "Let's play a game 🎮"]
          });
          return;
        }

        // Game request
        if (lowerInput.includes("game") || lowerInput.includes("play") || lowerInput.includes("trivia") || lowerInput.includes("guess")) {
          const game = GAMES[Math.floor(Math.random() * GAMES.length)];
          resolve({
            text: `Oh, I love games! Let's do it:\n\n${game}`,
            expression: "happy",
            suggestions: ["Elephant! 🐘", "8 legs! 🕷️", "Scissors ✌️", "Maybe later 🌻"]
          });
          return;
        }

        // Game responses handling (Elephant)
        if (lowerInput.includes("elephant") || lowerInput.includes("trunk")) {
          resolve({
            text: "Hooray! You got it right! It's an Elephant! 🐘 You are super smart! Here is a star for you! ⭐",
            expression: "happy",
            suggestions: ["Play another game 🎮", "Tell me a joke! 🤪"]
          });
          return;
        }

        // Game responses handling (Spider)
        if (lowerInput.includes("8") || lowerInput.includes("eight")) {
          resolve({
            text: "Correct! Spiders have exactly 8 legs! 🕷️ Outstanding job, friend! High five! ✋",
            expression: "happy",
            suggestions: ["Play another game 🎮", "Tell me a story 📖"]
          });
          return;
        }

        // Game responses handling (Rock-Paper-Scissors)
        if (lowerInput.includes("rock") || lowerInput.includes("paper") || lowerInput.includes("scissors")) {
          const options = ["Rock ✊", "Paper ✋", "Scissors ✌️"];
          const botChoice = options[Math.floor(Math.random() * options.length)];
          let outcome = "It's a tie! Let's go again! 🤝";
          
          if (lowerInput.includes("rock")) {
            if (botChoice.includes("Scissors")) outcome = "You Win! Your Rock smashed my Scissors! 🏆✊";
            if (botChoice.includes("Paper")) outcome = "I Win! My Paper covered your Rock! 📄🤭";
          } else if (lowerInput.includes("paper")) {
            if (botChoice.includes("Rock")) outcome = "You Win! Your Paper covered my Rock! 🏆📄";
            if (botChoice.includes("Scissors")) outcome = "I Win! My Scissors cut your Paper! ✂️🤭";
          } else if (lowerInput.includes("scissors")) {
            if (botChoice.includes("Paper")) outcome = "You Win! Your Scissors cut my Paper! 🏆✂️";
            if (botChoice.includes("Rock")) outcome = "I Win! My Rock smashed your Scissors! ✊🤭";
          }

          resolve({
            text: `I chose: ${botChoice}!\n\n${outcome}`,
            expression: "happy",
            suggestions: ["Play Rock-Paper-Scissors again! 🎮", "Tell me a fact 🧐"]
          });
          return;
        }

        // Thank you
        if (lowerInput.includes("thank") || lowerInput.includes("thanks") || lowerInput.includes("love you")) {
          resolve({
            text: "Aww, you are very welcome! Helping friends is my favorite thing in the whole dinosaur world! 🦕💕 You are awesome!",
            expression: "happy",
            suggestions: ["Tell me a joke! 🤪", "Play a game 🎮"]
          });
          return;
        }

        // Fallback
        resolve({
          text: "Ooh, that sounds interesting! 🦕 Tell me more about it, or select one of the ideas below! I'd love to learn from you!",
          expression: "speaking",
          suggestions: ["Tell me a joke! 🤪", "Tell me a story 📖", "Let's play a game 🎮", "Why is sky blue? 🌌"]
        });
      }, 1200); // 1.2 second typing delay for child friendly feel
    });
  });
}
