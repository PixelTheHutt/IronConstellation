/* Tailwind Configuration 
    Must be defined before the Tailwind CDN script runs.
*/
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#3b82f6", // Blue-500
                "background-light": "#e5e7eb", // Gray-200
                "background-dark": "#18181b", // Zinc-900
                "panel-light": "#f3f4f6", // Gray-100
                "panel-dark": "#27272a", // Zinc-800
                "border-light": "#d1d5db", // Gray-300
                "border-dark": "#3f3f46", // Zinc-700
            },
            fontFamily: {
                display: ["'JetBrains Mono'", "monospace"],
                body: ["'Inter'", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.25rem",
            },
        },
    },
};

/* Theme Initialization Logic
    Checks LocalStorage or System Preference to apply dark mode immediately.
*/
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
} else {
    document.documentElement.classList.remove('dark')
}

/* Global Function: Toggle Theme
    This is called by the user interface to switch modes.
*/
window.toggleTheme = function() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
}