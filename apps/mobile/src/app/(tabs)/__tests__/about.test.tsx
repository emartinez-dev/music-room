import { render, screen } from "@testing-library/react-native";

import AboutScreen from "../about";

describe("About screen", () => {
  it("should render its heading", async () => {
    await render(<AboutScreen />);

    expect(screen.getByText("About screen")).toBeTruthy();
  });
});
