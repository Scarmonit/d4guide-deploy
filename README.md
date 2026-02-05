# Scarmonit Gaming Hub - Diablo 4 Guides & Tools

Welcome to the **Scarmonit Gaming Hub**, a comprehensive platform for Diablo 4 build guides, gaming tools, file sharing, and community resources. This project is hosted on **Cloudflare Pages** and leverages **Cloudflare R2** for secure and scalable file storage.

## 🚀 Features

*   **Diablo 4 Build Guides:** detailed guides for various classes (e.g., Auradin).
*   **File Hosting:** Secure file uploads and downloads powered by Cloudflare R2 buckets.
*   **Gaming Tools:** Interactive tools for gamers.
*   **Community Integration:** Discord and YouTube integration.
*   **Visuals:** High-quality, responsive design with a cyberpunk/dark aesthetic.

## 🛠️ Tech Stack

*   **Frontend:** HTML5, CSS3 (Custom Properties, Flexbox/Grid), JavaScript (Vanilla).
*   **Backend:** Cloudflare Pages Functions (Serverless).
*   **Storage:** Cloudflare R2 (Object Storage).
*   **Utilities:** Python scripts for asset generation/modification.
*   **Deployment:** Cloudflare Pages.

## 📂 Project Structure

```
d4guide-deploy/
├── functions/          # Cloudflare Pages Functions (API endpoints)
├── game/               # Game-related assets or sub-modules
├── add_timer_*.py      # Python utility scripts for timer components
├── *.html              # Static HTML pages (index, tools, upload, etc.)
├── *.js                # Client-side JavaScript (e.g., cursor-particles.js)
├── wrangler.toml       # Cloudflare Wrangler configuration
└── README.md           # Project documentation
```

## ⚡ Setup & Development

### Prerequisites

*   [Node.js](https://nodejs.org/) (for Wrangler CLI)
*   [Python 3.x](https://www.python.org/) (for utility scripts)
*   Cloudflare Account (for deployment)

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Scarmonit/d4guide-deploy.git
    cd d4guide-deploy
    ```

2.  **Install Wrangler (if not installed):**
    ```bash
    npm install -g wrangler
    ```

3.  **Run locally:**
    ```bash
    npx wrangler pages dev .
    ```
    This will start a local server emulating Cloudflare Pages.

### Deployment

This project is configured for **Cloudflare Pages**.

1.  **Connect to Cloudflare:**
    Link your GitHub repository to a new Cloudflare Pages project.

2.  **Configuration:**
    Ensure your build settings are correct (root directory is `.`).
    The `wrangler.toml` file handles the R2 bucket binding (`scarmonit-downloads`).

3.  **Manual Deploy:**
    ```bash
    npx wrangler pages deploy .
    ```

## 🐍 Utility Scripts

*   `add_timer_css.py`: Generates/Injects CSS for the timer functionality.
*   `add_timer_html_js.py`: Generates/Injects HTML and JS for the timer.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## 📄 License

[MIT](LICENSE) (or specify your license)
