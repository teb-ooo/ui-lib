import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { setViewportWidth } from "../../test/cmdk/viewport";
import { Dialog } from "./dialog";
import { SplitPane } from "./split-pane";

describe("Dialog", () => {
  it("dims the page when it opens inside another dialog (a phone's detail view)", () => {
    setViewportWidth(390);
    render(
      <SplitPane
        list={<p>list</p>}
        detail={
          <Dialog open title="Delete this note?">
            <p>sure</p>
          </Dialog>
        }
        detailOpen
        detailLabel="Note"
        onDetailClose={() => undefined}
      />,
    );
    expect(document.querySelector(".anim-backdrop")).not.toBeNull();
  });
});
