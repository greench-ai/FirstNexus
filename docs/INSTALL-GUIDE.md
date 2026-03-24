# NexusClaw — Install Guide

**Difficulty:** Beginner  
**Time:** 15–20 minutes  
**Computer:** Linux, macOS, or Windows (WSL2)

> **Based on [OpenClaw](https://github.com/openclaw/openclaw)** — NexusClaw is a personal fork of OpenClaw, extended with EvoClaw memory, 60+ bundled skills, and 10 UI themes. All the power of OpenClaw, ready to go.

---

## What is NexusClaw?

NexusClaw is an AI assistant that runs on your own computer. It can:

- Search the web and read websites for you
- Manage your files and code
- Send messages through WhatsApp, Telegram, Discord, iMessage
- Track your calendar and to-do lists
- Trade crypto automatically
- Remember everything across conversations
- And 60+ other things

Your API key (which powers the AI) stays on your machine. Nothing private is ever sent anywhere you don't control.

---

## Step 1 — Automatic Setup (Fastest)

NexusClaw has a built-in setup wizard. Run this and follow the prompts:

```
nexusclaw onboard
```

This will automatically:

- Check your system for Node.js and Git
- Download NexusClaw from GitHub
- Build everything
- Ask for your API key
- Start the Gateway
- Print your dashboard URL

If `nexusclaw` is not recognised yet, follow Steps 2–4 first, then come back and run `nexusclaw onboard`.

---

## Step 2 — Get a Terminal

The Terminal is a text-based way to talk to your computer. It's faster than pointing and clicking, and some things can only be done here.

**On macOS:**
Press `Command + Space`, type `Terminal`, press Enter.

**On Linux:**
Press `Ctrl + Alt + T`. Or right-click the desktop and choose **Open Terminal**.

**On Windows (WSL2):**
WSL2 lets you run Linux inside Windows — free and straightforward.

1. Open PowerShell as Administrator (right-click the Start button → **Terminal (Admin)**)
2. Paste this and press Enter:
   ```
   wsl --install
   ```
3. Restart your computer when asked.
4. After restarting, search for `Ubuntu` in the Start menu and press Enter.
5. You'll be asked to create a username and password. Type them in. This is your Linux terminal.

---

## Step 3 — Install Git

Git is a tool that downloads code from the internet. You need it to get NexusClaw.

In your Terminal, paste this and press Enter:

```
sudo apt update && sudo apt install git -y
```

You may be asked for your password. Type it and press Enter. You won't see the characters as you type — that's normal.

---

## Step 4 — Install Node.js

Node.js is the engine that runs NexusClaw. You need version 22 or higher.

Paste this and press Enter:

```
curl -fsSL https://fnm.vercel.app/install | bash
```

When it finishes, paste these two commands, one at a time:

```
source ~/.bashrc
```

```
fnm install 22 && fnm use 22
```

Check it worked:

```
node --version
```

You should see a number like `v22.x.x`. If it starts with a number lower than 22, restart the Terminal and try again.

---

## Step 5 — Install pnpm

pnpm is a package manager. It handles all the tiny pieces of code NexusClaw needs.

```
npm install -g pnpm
```

---

## Step 6 — Download NexusClaw

Go to your home folder and download NexusClaw from GitHub:

```
cd ~
git clone https://github.com/greench-ai/nexusclaw.git
```

This creates a new folder called `nexusclaw` in your home directory.

Enter the folder:

```
cd nexusclaw
```

---

## Step 7 — Install all the code

NexusClaw needs a bunch of extra code pieces to work. This installs them all at once:

```
pnpm install --no-frozen-lockfile
```

This takes 2–5 minutes. Wait for the prompt to come back before continuing.

---

## Step 8 — Build NexusClaw

"Building" turns the raw code into something your computer can actually run.

```
pnpm build && pnpm ui:build
```

This also takes a few minutes. Wait for the prompt.

---

## Step 9 — Create the nexusclaw command

Right now NexusClaw only works inside the `nexusclaw` folder. We want to be able to type `nexusclaw` from anywhere.

First, create a shortcuts folder:

```
mkdir -p ~/bin
```

Then create the shortcut:

```
cat > ~/bin/nexusclaw << 'EOF'
#!/bin/bash
exec node /home/$USER/nexusclaw/nexusclaw.mjs "$@"
EOF
```

Make it runnable:

```
chmod +x ~/bin/nexusclaw
```

Add the folder to your path (so your computer knows where to find the command):

```
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Test it:

```
nexusclaw --version
```

You should see: `NexusClaw 1.0.0 (...)`

---

## Step 10 — Get an Anthropic API key

NexusClaw needs an API key to talk to the AI. This key is yours and stays on your machine.

1. Go to [console.anthropic.com](https://console.anthropic.com) and create a free account
2. Click **API Keys** in the left sidebar
3. Click **Create Key**
4. Copy the key (Ctrl+A then Ctrl+C)
5. Back in the Terminal, paste:

```
nexusclaw secrets configure
```

6. Paste your API key when asked
7. Press Enter

Your key is saved locally and will only ever be sent directly to Anthropic's servers.

---

## Step 11 — Start the Gateway

The Gateway is the engine that makes NexusClaw work. It's like turning on your computer — you only need to do this once.

Install it as a background service:

```
nexusclaw gateway install
```

Start it now:

```
nexusclaw gateway start
```

Check it's running:

```
nexusclaw gateway status
```

You should see: `listening on 19789`

After this, the Gateway will start automatically every time you turn on your computer.

---

## Step 12 — Open the Control Dashboard

The Dashboard is a website that lets you chat with NexusClaw in your browser.

Tell NexusClaw to open it:

```
nexusclaw dashboard
```

Then open your browser and go to:

```
http://localhost:19789
```

You'll see a login screen. To get your token, run:

```
nexusclaw gateway status
```

Look for the line that says `token=`. Copy everything after the `=` sign. Paste it into the login screen in your browser.

You should now see the NexusClaw interface.

---

## Step 13 — Say hello

Click the chat box at the bottom and type:

```
Hello, what's your name?
```

Press Enter. NexusClaw will respond.

---

## How to know everything is working

Run these three commands:

```
nexusclaw --version
```
Should say: `NexusClaw 1.0.0 (...)`

```
nexusclaw gateway status
```
Should say: `listening on 19789`

```
nexusclaw cron list
```
Should show 3 jobs running (evoclaw-heartbeat, memory-save, library-update)

---

## If something goes wrong

**"nexusclaw: command not found"**

Your computer does not know where the command is. Run:

```
export PATH="$HOME/bin:$PATH"
```

Then try `nexusclaw --version` again. If it works, make it permanent:

```
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
```

**Gateway shows an error instead of "listening"**

```
nexusclaw doctor --fix
```

This automatically diagnoses and fixes the most common problems.

**Node version is too old**

```
node --version
```

If it shows a number below 22:

```
source ~/.bashrc
fnm install 22
fnm use 22
```

Restart your Terminal and try again.

---

## Where everything lives

NexusClaw stores its files in a hidden folder called `.nexusclaw` in your home directory.

To see hidden folders in your file browser:

- **macOS:** Press `Cmd + Shift + .` in Finder
- **Linux:** Press `Ctrl + H`

Inside `~/.nexusclaw/`:

| Folder | What it is |
|--------|-----------|
| `config/` | Your gateway settings |
| `workspace/` | NexusClaw's working files and memory |
| `library/` | Cached code libraries |

The most important files in `workspace/`:

| File | What it is |
|------|-----------|
| `SOUL.md` | NexusClaw's identity and personality |
| `MEMORY.md` | Everything NexusClaw remembers long-term |
| `memory/` | Daily logs of what happened |

---

## Updating NexusClaw

NexusClaw improves regularly. To update:

```
cd ~/nexusclaw
git pull
pnpm install
pnpm build && pnpm ui:build
nexusclaw gateway restart
```

---

## Still stuck?

```
nexusclaw help
nexusclaw doctor --fix
```

Or open an issue at: [github.com/greench-ai/nexusclaw/issues](https://github.com/greench-ai/nexusclaw/issues)

---

*NexusClaw. Your agent. Your machine. Your rules.*
