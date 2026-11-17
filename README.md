# UNKNOWN WORLD – Current Affairs Quiz Platform (Staging Package)

**Tagline:** *Where the UnKnown becomes UnForgettable.*

This is the frontend package for staging and Cloudflare Pages setup. It includes the existing quiz UI and September 2026 question bank.

## Files
- `index.html` – app shell and Telegram join/verification screen
- `style.css` – custom styles and print styling
- `app.js` – quiz interface, timer, scoring, history, and local admin tools
- `questions.json` – quiz modules and question bank
- `assets/logo.svg` – logo/favicon
- `.nojekyll` – static hosting helper

## Important security status
**This package is not production-ready for subscriber-only access.** The verification screen is deliberately fail-closed: it will not unlock quizzes until secure Telegram sign-in and server-side membership verification are implemented. A Telegram numeric user ID typed by a visitor is not proof of identity. Do not restore the old localStorage-based verification or expose a bot token in frontend files.

The current Admin Dashboard is a browser-side/local tool, not a secure shared admin system. Do not treat it as protected or use it to publish changes to all visitors.

## Upload to your GitHub repository
1. Extract this ZIP on your computer.
2. Open your repository: `https://github.com/Akashh-XD/CDS-Journey-Sept-CA-Quiz`.
3. Click **Add file → Upload files**.
4. Upload the *contents* of the extracted folder (not the ZIP itself) so `index.html`, `app.js`, `questions.json`, `style.css`, `.nojekyll`, and `assets/` are at the repository root.
5. Enter a commit message such as `Add Unknown World quiz frontend` and click **Commit changes**.

## Deploy a staging site with Cloudflare Pages
1. Sign in to Cloudflare Dashboard.
2. Open **Workers & Pages → Create → Pages → Connect to Git**.
3. Connect GitHub and select `Akashh-XD/CDS-Journey-Sept-CA-Quiz`.
4. For a plain static site, choose **None** as the framework preset. Leave the build command empty. Set the build output directory to `/` (or `.` if the dashboard requests a relative directory).
5. Deploy. Cloudflare will provide a `*.pages.dev` URL.

Use that URL for staging and to complete the website-domain setup in BotFather if Telegram's login setup asks for it. Do not enter a guessed URL.

## Before public launch
A secure backend still needs to be implemented and tested. It must authenticate the actual Telegram user (for example, by validating Telegram's signed Login/Web App authentication data), then call Telegram Bot API `getChatMember` from a Cloudflare Worker using a secret bot token. The Worker must never accept a visitor-supplied Telegram ID as proof of identity. Store secrets only in Cloudflare Worker secrets, never in GitHub or browser JavaScript.
