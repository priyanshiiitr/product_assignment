# Deploy — do this part yourself (needs your own GitHub/Vercel login)

Everything is committed locally already. I can't push to your GitHub or log into Vercel on your behalf, so these last two steps need you.

## 1. Push to GitHub

Create an empty repo on github.com (no README/license, so it doesn't conflict), then:

```
cd E:\Numbla_Assignment
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 2. Deploy on Vercel

Root directory is `app` (not the repo root), because the docs live one level up.

```
cd E:\Numbla_Assignment\app
npx vercel --prod
```

It'll ask you to log in (GitHub login is fine) and confirm the project settings — accept the defaults (Vite auto-detected, build command `npm run build`, output `dist`). It gives you a live URL when done.

If you'd rather use the Vercel dashboard instead of the CLI: import the GitHub repo, and in the project settings set **Root Directory** to `app` before deploying.

## 3. Confirm it's actually public

Open the deployed link in a private/incognito window before submitting — confirms it's not gated behind your Vercel login.

## 4. Fill in the link

Paste the live URL into `SUBMISSION.md` under "4. Working app", and into `README.md` where it says "added after deployment".
