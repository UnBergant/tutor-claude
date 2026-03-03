import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExerciseShell } from "./exercise-shell";

const defaultProps = { current: 1, total: 5 };

function getShimmerOverlay(container: HTMLElement) {
  return container.querySelector(".animate-shimmer");
}

function getSkeleton(container: HTMLElement) {
  return container.querySelector(".animate-pulse");
}

describe("ExerciseShell", () => {
  it("renders children and progress info", () => {
    render(
      <ExerciseShell {...defaultProps}>
        <p>Exercise content</p>
      </ExerciseShell>,
    );

    expect(screen.getByText("Question 1 of 5")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("Exercise content")).toBeInTheDocument();
  });

  it("does not render shimmer overlay or skeleton by default", () => {
    const { container } = render(
      <ExerciseShell {...defaultProps}>
        <p>Content</p>
      </ExerciseShell>,
    );

    expect(getShimmerOverlay(container)).not.toBeInTheDocument();
    expect(getSkeleton(container)).not.toBeInTheDocument();
  });

  it("renders shimmer overlay when submitting is true", () => {
    const { container } = render(
      <ExerciseShell {...defaultProps} submitting>
        <p>Content</p>
      </ExerciseShell>,
    );

    expect(getShimmerOverlay(container)).toBeInTheDocument();
  });

  it("does not render shimmer overlay when submitting is false", () => {
    const { container } = render(
      <ExerciseShell {...defaultProps} submitting={false}>
        <p>Content</p>
      </ExerciseShell>,
    );

    expect(getShimmerOverlay(container)).not.toBeInTheDocument();
  });

  it("renders skeleton instead of children when loading is true", () => {
    const { container } = render(
      <ExerciseShell {...defaultProps} loading>
        <p>Hidden content</p>
      </ExerciseShell>,
    );

    expect(getSkeleton(container)).toBeInTheDocument();
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("renders both shimmer overlay and skeleton when submitting and loading", () => {
    const { container } = render(
      <ExerciseShell {...defaultProps} submitting loading>
        <p>Hidden content</p>
      </ExerciseShell>,
    );

    expect(getShimmerOverlay(container)).toBeInTheDocument();
    expect(getSkeleton(container)).toBeInTheDocument();
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <ExerciseShell {...defaultProps} title="Grammar Exercise">
        <p>Content</p>
      </ExerciseShell>,
    );

    expect(screen.getByText("Grammar Exercise")).toBeInTheDocument();
  });
});
