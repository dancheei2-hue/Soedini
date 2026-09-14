import { useEffect } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./style.css";

function AppShell() {
  useEffect(() => {
    let previousGameScreen = null;

    const resetScrollWhenGameOpens = () => {
      const gameScreen =
        document.querySelector(".game-screen");

      if (gameScreen && gameScreen !== previousGameScreen) {
        previousGameScreen = gameScreen;

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });

        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }

      if (!gameScreen) {
        previousGameScreen = null;
      }
    };

    resetScrollWhenGameOpens();

    const observer = new MutationObserver(
      resetScrollWhenGameOpens
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return <App />;
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);
