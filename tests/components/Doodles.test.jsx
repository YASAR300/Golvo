import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import {
  CurlyArrow,
  DoodleCheck,
  DoodleHeart,
  ScribbleCircle,
  ScribbleUnderline,
  SparkleStar,
  SquigglyLine,
} from "@/components/doodles";

describe("Doodle Components — Smoke Tests", () => {
  const doodles = [
    { name: "CurlyArrow", Component: CurlyArrow },
    { name: "DoodleCheck", Component: DoodleCheck },
    { name: "DoodleHeart", Component: DoodleHeart },
    { name: "ScribbleCircle", Component: ScribbleCircle },
    { name: "ScribbleUnderline", Component: ScribbleUnderline },
    { name: "SparkleStar", Component: SparkleStar },
    { name: "SquigglyLine", Component: SquigglyLine },
  ];

  for (const { name, Component } of doodles) {
    it(`${name} renders an <svg> element and accepts custom className`, () => {
      const customClass = `test-doodle-class-${name.toLowerCase()}`;
      const { container } = render(<Component className={customClass} />);

      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveClass(customClass);
    });
  }
});
