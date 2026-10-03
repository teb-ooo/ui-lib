import { Prose } from "./prose";
import type { StoryDefault, StoryMeta } from "../stories";

export default {
  title: "Prose",
  group: "Atoms",
  description:
    "The look of rich text and the type scale demo: wrap rendered HTML (markdown output, an editor's content) and every element is styled. One body size; headings differ by case, style, colour, rules and spacing.",
  aliases: ["rich text", "markdown", "typography", "type scale", "headings", "article", "content", "wysiwyg", "note body"],
  component: "Prose",
  source: "src/components/prose.tsx",
} satisfies StoryDefault;

export const TypeScale = () => (
  <Prose>
    <h1>Heading 1: the title of the document</h1>
    <p>
      Body text is the one size. Headings are told apart by case, style, colour, rules and spacing, never by a larger size or a heavier weight. A
      paragraph with <strong>bold</strong>, <em>italic</em>, <del>struck</del>, <code>inline code</code> and a <a href="#top">link</a>.
    </p>
    <h2>Heading 2: a section</h2>
    <p>Sections carry a dotted rule and more space above them than between paragraphs, so they read as breaks.</p>
    <h3>Heading 3: a label</h3>
    <p>Level 3 is a quiet uppercase label, the same voice as a field label.</p>
    <h4>Heading 4: a run-in note</h4>
    <p>Level 4 is italic. Levels 5 and 6 are muted bold.</p>
    <h5>Heading 5</h5>
    <h6>Heading 6</h6>
    <ul>
      <li>A bullet list</li>
      <li>
        With a nested list
        <ul>
          <li>one</li>
          <li>two</li>
        </ul>
      </li>
    </ul>
    <ol>
      <li>A numbered list</li>
      <li>Second item</li>
    </ol>
    <blockquote>A quotation is muted with a rule on its left.</blockquote>
    <pre>
      <code>{"const answer = 42;\nconsole.log(answer);"}</code>
    </pre>
    <hr />
    <table>
      <thead>
        <tr>
          <th>Element</th>
          <th>Look</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>h1</td>
          <td>uppercase, rule under</td>
        </tr>
        <tr>
          <td>h3</td>
          <td>uppercase, muted</td>
        </tr>
      </tbody>
    </table>
  </Prose>
);
TypeScale.storyMeta = {
  description: "Every element at once: the demo of how standard rich text is meant to look. Change it here, in theme.css under .prose, and iterate.",
} satisfies StoryMeta;

export const Notes = () => (
  <Prose>
    <h2>Trip to Lisbon</h2>
    <p>Flights booked for the 14th. See also the packing list.</p>
    <h3>Days</h3>
    <ul>
      <li>Alfama and the castle</li>
      <li>Day trip to Sintra</li>
    </ul>
    <blockquote>Take the tram early; the queues start at ten.</blockquote>
  </Prose>
);
Notes.storyMeta = { description: "A short note as an app would show it." } satisfies StoryMeta;
