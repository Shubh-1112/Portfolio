# Personal Portfolio Website ✨

A modern, high-performance portfolio website designed to showcase projects, skills, and professional experience. Built with a focus on immersive user experiences, featuring smooth scrolling, complex animations, a premium dark-glassmorphic UI, and fully responsive design.

## 🚀 Key Features

*   **Premium Aesthetic:** Elegant dark theme with custom glassmorphic UI elements and carefully crafted color palettes.
*   **Advanced Animations:** Powered by **GSAP** (GreenSock Animation Platform) for buttery-smooth page transitions, staggered reveals, and interactive elements.
*   **Physics-Based Smooth Scrolling:** Integrates **Lenis** for a natural, inertia-based scrolling experience at 60+ FPS.
*   **Custom Horizontal Scroll Reel:** A bespoke, Apple-style horizontal scroll section for the "Work" portfolio, completely mathematically mapped to vertical scroll mechanics.
*   **Fully Responsive:** Flawless experience across desktop, tablet, and mobile devices, including a custom animated mobile hamburger navigation menu.
*   **High Performance:** Optimized asset loading and minimized Cumulative Layout Shift (CLS) for blazing-fast load times.

## 🛠️ Technologies Used

*   **HTML5 & CSS3:** Semantic structure and advanced styling (Flexbox, CSS Grid, Custom Properties).
*   **Vanilla JavaScript:** Core logic, DOM manipulation, and advanced scroll state management.
*   **GSAP:** Industry-standard library for complex, timeline-based web animations.
*   **Lenis:** Lightweight, robust smooth-scroll engine.

## 📂 Project Structure

*   `index.html` - The stylish entry point and loading screen featuring a slice-wipe transition.
*   `main.html` - The core portfolio page containing all content sections (About, Work, Skills, Hobbies).
*   `styles.css` - The comprehensive stylesheet containing all design tokens, responsive media queries, and UI styling.
*   `main.js` - Global logic for horizontal scrolling, mobile navigation, carousel features, and GSAP integration.
*   `Assets/` - Directory containing all optimized imagery, icons, PDF resumes, and animation sequences.

## 💻 Local Execution

To run this project locally on your machine:

**Option 1: Quick View**
Simply double-click the `index.html` file to open it in your default web browser. 
*(Note: Some advanced animations or asset loading may require a local server to bypass browser CORS security policies).*

**Option 2: Recommended (VS Code)**
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension.
3. Right-click on `index.html` and select **"Open with Live Server"**.

**Option 3: Terminal (Using Python)**
If you are comfortable with the terminal, you can start a simple static web server:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000`.

## 🤝 Contact

Feel free to explore the code or reach out!
