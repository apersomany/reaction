# Reaction Time Test (반응속도 테스트)

This project is a web application designed to measure and analyze human reaction times to visual and auditory stimuli. It was developed as a **final project** for the **Scientific and Technical Writing (과학기술글쓰기)** course at Sungkyunkwan University (SKKU).

## Project Overview

The application conducts two types of reaction time tests:
1.  **Visual Reaction Test**: Measures how quickly a user responds to a color change on the screen. It varies the Hue and Chroma of the stimulus to analyze if these properties affect reaction time.
2.  **Auditory Reaction Test**: Measures how quickly a user responds to a sound. It varies the frequency of the sound (400Hz, 1600Hz, 6400Hz) to analyze the effect of pitch on reaction time.

After completing the tests, users are presented with a detailed analysis of their performance, including:
*   Comparison between visual and auditory reaction times.
*   Breakdown of reaction times by color properties (Hue, Chroma).
*   Breakdown of reaction times by sound frequency.
*   Percentile ranking compared to other users.

## Features

*   **User Demographics**: Collects basic user information (Nickname, Age, Sex) for statistical analysis.
*   **Interactive Tests**:
    *   Randomized inter-stimulus intervals to prevent anticipation.
    *   Randomized sequence of stimulus properties (Color/Frequency).
    *   Precise timing measurement using `performance.now()`.
*   **Data Visualization**: Uses `Chart.js` to display interactive graphs of the results.
*   **Ranking System**: Calculates and displays the user's percentile ranking based on the collected dataset.
*   **Responsive Design**: Works on both desktop and mobile devices.

## Technology Stack

*   **Framework**: [SvelteKit](https://kit.svelte.dev/)
*   **Language**: JavaScript / TypeScript
*   **Styling**: CSS (Scoped Svelte styles)
*   **Charts**: [Chart.js](https://www.chartjs.org/)
*   **Color Manipulation**: [Chroma.js](https://gka.github.io/chroma.js/)
*   **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
*   **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)

## Installation and Usage

To run this project locally, follow these steps:

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd reaction
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

4.  **Build for production**
    ```bash
    npm run build
    ```

## Database Schema

The project uses a relational database (SQLite via Cloudflare D1) with the following structure:

*   **`user`**: Stores user demographic information.
    *   `id`, `nickname`, `age`, `sex`, `phone_no`
*   **`visual`**: Stores individual visual reaction test results.
    *   `user` (FK), `time`, `mean`, `data` (JSON details of samples)
*   **`auditory`**: Stores individual auditory reaction test results.
    *   `user` (FK), `time`, `mean`, `data` (JSON details of samples)
*   **`statistics`**: Caches calculated percentiles for ranking.