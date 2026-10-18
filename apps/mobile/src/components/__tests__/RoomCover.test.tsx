import { render, screen } from "@testing-library/react-native";

import { RoomCover } from "../RoomCover";

type Node = { type: string; props: { source?: { uri: string } }; children: Node[] | null };

// Images have no text or role to query by, so collect their URIs from the rendered tree
function imageUris(): string[] {
  const uris: string[] = [];
  const visit = (node: Node | string | null) => {
    if (!node || typeof node === "string") return;
    if (node.type === "Image" && node.props.source) uris.push(node.props.source.uri);
    node.children?.forEach(visit);
  };
  visit(screen.toJSON() as Node | null);
  return uris;
}

describe("RoomCover", () => {
  it("should show a mosaic of the first four different track images", async () => {
    await render(
      <RoomCover name="Friday" size={100} images={["1", "2", "2", "", "3", "4", "5"]} />,
    );

    expect(imageUris()).toEqual(["1", "2", "3", "4"]);
  });

  it("should show a single image when there are fewer than four", async () => {
    await render(<RoomCover name="Friday" size={100} images={["1", "2"]} />);

    expect(imageUris()).toEqual(["1"]);
  });

  it("should show a color tile with the room name on large covers without images", async () => {
    await render(<RoomCover name="Friday" size={200} />);

    expect(imageUris()).toEqual([]);
    expect(screen.getByText("Friday")).toBeTruthy();
  });

  it("should hide the room name on small tiles", async () => {
    await render(<RoomCover name="Friday" size={48} />);

    expect(screen.queryByText("Friday")).toBeNull();
  });
});
