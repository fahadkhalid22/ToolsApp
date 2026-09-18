import { featuredTools } from "@/data/tools";

import { QuickToolCard } from "./QuickToolCard";
import { ToolCommandBar } from "./ToolCommandBar";
import styles from "./HomeHero.module.css";

export function HomeHero() {
  return (
    <main className={styles.main} id="main-content">
      <section className={styles.hero} aria-labelledby="home-heading">
        <div className={styles.spark} aria-hidden="true">
          <span className={styles.sparkCore} />
          <span className={styles.sparkRayOne} />
          <span className={styles.sparkRayTwo} />
          <span className={styles.sparkDot} />
        </div>
        <p className={styles.eyebrow}>100+ tools. One focused workspace.</p>
        <h1 className="font-heading" id="home-heading">
          What would you like to do today?
        </h1>
        <p className={styles.intro}>
          Search, convert, calculate, create, and get things done.
        </p>
      </section>

      <section className={styles.quickTools} aria-labelledby="quick-tools-heading">
        <div className={styles.sectionHeading}>
          <h2 className="sr-only" id="quick-tools-heading">
            Quick tools
          </h2>
          <span>Jump back in</span>
          <span className={styles.rule} />
          <small>Popular today</small>
        </div>
        <div className={styles.cardGrid}>
          {featuredTools.map((tool) => (
            <QuickToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <ToolCommandBar />
    </main>
  );
}
