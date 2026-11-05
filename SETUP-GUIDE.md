# ForFoodSake website – setup guide

This folder is the complete ForFoodSake website. It's free to host on Netlify, and Natasha can add recipes herself from **yoursite/admin** without touching any code.

**How it fits together**

- **GitHub** stores the website files, including every recipe.
- **Netlify** turns those files into the live website and republishes it automatically whenever something changes (about a minute).
- **The recipe editor** (Decap CMS, at `/admin`) is a simple form for adding and editing recipes. It saves straight to GitHub, which then triggers Netlify.

You only do the setup below once. It takes about 30–45 minutes.

---

## Step 1 – Put the site on GitHub

1. Create a free account at **github.com** (use the ForFoodSake email so it belongs to the business).
2. Click **New repository** and name it `forfoodsake-site`. Leave it **Public** or choose **Private** (both work), and don't add a README.
3. On the empty repository page, click **uploading an existing file**.
4. Unzip this folder on your computer, open it, select **everything inside it** (not the folder itself) and drag it into the upload area. Click **Commit changes**.

## Step 2 – Tell the editor where the site lives

1. In GitHub, open `admin/config.yml` and click the pencil icon to edit.
2. Change `YOUR-GITHUB-USERNAME` to your GitHub username, for example `repo: forfoodsakeldn/forfoodsake-site`.
3. Click **Commit changes**.

## Step 3 – Publish it on Netlify

1. Create a free account at **netlify.com** and choose **Sign up with GitHub**.
2. Click **Add new site → Import an existing project → GitHub**, then pick `forfoodsake-site`.
3. Netlify reads the settings from `netlify.toml` automatically (build command `node build.js`, publish folder `dist`). Click **Deploy**.
4. After a minute the site is live at an address like `random-name-123.netlify.app`. Under **Site configuration → Change site name**, you can rename it to something like `forfoodsake.netlify.app`.

## Step 4 – Switch on the recipe editor login

The editor logs in with GitHub, using Netlify as the go-between.

1. In GitHub, go to **Settings → Developer settings → OAuth Apps → New OAuth App** and fill in:
   - Application name: `ForFoodSake editor`
   - Homepage URL: your Netlify address, for example `https://forfoodsake.netlify.app`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. Click **Register application**, then **Generate a new client secret**. Keep the page open.
3. In Netlify, open your site, then go to **Project configuration → Access & security → OAuth → Install provider**. Choose **GitHub** and paste in the **Client ID** and **Client secret**.
4. Go to `yoursite/admin` and click **Login with GitHub**. You're in.

If anyone else needs to add recipes, add their GitHub account under the repository's **Settings → Collaborators**.

## Step 5 – Use your own domain (optional, recommended)

1. Buy a domain, for example `forfoodsake.co.uk` (around £5–15 a year from Namecheap, Cloudflare or 123-reg). You can also buy one inside Netlify.
2. In Netlify go to **Domain management → Add a domain**, enter it and follow the instructions to point it at Netlify. Netlify adds the secure `https` padlock for free.
3. Update `site_url` and `display_url` in `admin/config.yml` to the new address.
4. In the GitHub OAuth app from Step 4, update the Homepage URL to the new address.

---

## Day to day: adding a recipe

1. Go to **yoursite/admin** and log in.
2. Click **Recipes → New Recipe**.
3. Fill in the name, date, category, any collections, photo, times, ingredients (one per line), method steps and tips. Tick **Show in the homepage carousel** if it should be featured.
4. Click **Publish → Publish now**.

About a minute later, the recipe is live on the recipe page, in the "Latest recipes" list (if it's one of the newest four), in its category filter and in any collections you picked.

**Also editable from /admin:**

- **Collections**: add a new series (for example "Ramadan" or "Summer BBQ"), change the descriptions, intros or tile colours.
- **Site settings → About page**: the intro, portrait, tags, "How it all started" paragraphs and travel postcards (including the must-eat dish, year and a photo for each).
- **Site settings → Contact and social links**: the Instagram, TikTok and email details.

## Changing the design

Layout, colours and fonts live in these files:

- `build.js`: the page layouts
- `static/css/style.css`: colours, fonts and spacing
- `static/js/main.js`: carousels, filters and arrows

Claude can make design changes for you. Share the file or the GitHub repository and describe the change.

## What's in the folder

```
content/recipes/        one .json file per recipe (the editor writes these)
content/collections/    one .json file per collection
content/settings/       About page + contact/social details
static/                 CSS, JavaScript, images (uploads go in static/images/uploads)
admin/                  the recipe editor (Decap CMS)
build.js                turns the content into the website (no installs needed)
netlify.toml            tells Netlify how to build the site
```

To preview locally (optional): with Node.js installed, run `node build.js`, then open the `dist` folder with any local web server.

## Before launch: checklist

- [ ] Replace the sample recipes' `[placeholder]` ingredients, steps and descriptions with Natasha's real recipes, or delete the samples in /admin.
- [ ] Add real photos to each recipe.
- [ ] Fill in the collection intros, and the must-eat dish and year on each travel postcard.
- [ ] Add a privacy policy page, and a cookie banner if you add analytics or ads (UK GDPR).
- [ ] Add the site to Google Search Console so recipes start showing up in Google.
