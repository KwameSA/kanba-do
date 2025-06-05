// Generate consistent color from tag text
export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }

  return color;
}

// Display error message
export function showError(message) {
  const errorEl = document.getElementById("error-message");
  errorEl.textContent = message;
  errorEl.style.display = "block";

  setTimeout(() => {
    errorEl.style.display = "none";
  }, 3000);
}

// Trigger vibration on supported devices
export function triggerVibration() {
  if (navigator.vibrate) {
    navigator.vibrate(100);
  }
}

// Pick a random congratulatory message
export function getRandomMessage() {
  const messages = [
    "Amazing! You’ve tackled everything on your plate!",
    "Outstanding! Task list cleared like a champ!",
    "Bravo! All tasks have been conquered!",
    "Great job! You’ve crossed the finish line!",
    "Fantastic! No more tasks, time to celebrate!",
    "Mission accomplished! What a pro!",
    "You’re on fire! Every task is done! 🔥",
    "Boom! All tasks obliterated! 💥",
    "Victory is yours! Nothing left to do! 🏆",
    "Cheers to your productivity! 🍻",
    "Kudos! You’re officially task-free!",
    "You’ve earned a break—awesome job! ☕",
    "You’re a rockstar! No tasks left behind! 🎸",
    "Legendary performance! All clear! 👑",
    "Fantastic work! You’ve aced it all! 💯",
    "Done and dusted! Time to relax. 🧘",
    "Woohoo! Everything is complete! 🎉",
    "Epic win! Your list is empty! 🚀",
    "Incredible! You’ve achieved task-zero!",
    "You’re unstoppable! No tasks remain!",
    "Congratulations! You’ve mastered productivity! 🧠",
    "What a superstar! Tasks cleared effortlessly.",
    "Impressive! You’ve knocked it out of the park! ⚾",
    "All done? You’re officially amazing!",
    "Gold medal for productivity goes to you! 🥇",
    "Task-free zone achieved! 👏",
    "You’re a wizard of productivity! 🧙‍♂️",
    "Mic drop! You’ve done it all. 🎤",
    "Perfection achieved. 🌟",
    "Achievement unlocked: Inbox Zero. 🕹️",
    "You deserve cake. 🍰",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}
