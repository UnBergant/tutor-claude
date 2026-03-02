import { expect, test } from "@playwright/test";

/**
 * E2E test for the chat page.
 *
 * Tests the situation picker, chat UI, and message flow.
 * Uses route interception to mock the SSE stream from /api/chat.
 */
test.describe("Chat Page", () => {
  test("displays situation picker", async ({ page }) => {
    await page.goto("/chat");

    const url = page.url();
    if (url.includes("/login")) {
      await expect(page.locator("text=Sign in")).toBeVisible();
      return;
    }

    // Situation picker should show title and scenarios
    await expect(page.locator("h1")).toContainText("Chat with Celestia");
    await expect(
      page.locator("text=Choose a conversation scenario"),
    ).toBeVisible();

    // Should show at least the Free Conversation option
    await expect(page.locator("text=Free Conversation")).toBeVisible();
  });

  test("shows all 6 situation cards", async ({ page }) => {
    await page.goto("/chat");

    const url = page.url();
    if (url.includes("/login")) return;

    // All 6 situations should be present
    await expect(page.locator("text=Free Conversation")).toBeVisible();
    await expect(page.locator("text=At a Restaurant")).toBeVisible();
    await expect(page.locator("text=Meeting Someone")).toBeVisible();
    await expect(page.locator("text=Job Interview")).toBeVisible();
    await expect(page.locator("text=At the Doctor")).toBeVisible();
    await expect(page.locator("text=Shopping")).toBeVisible();
  });

  test("starts chat session after selecting situation", async ({ page }) => {
    await page.goto("/chat");

    const url = page.url();
    if (url.includes("/login")) return;

    // Click "Free Conversation"
    await page.locator("text=Free Conversation").click();

    // Should now show chat UI with header and input
    await expect(page.locator("text=Chat with Celestia").first()).toBeVisible();
    await expect(page.locator("text=End Chat")).toBeVisible();
    await expect(
      page.locator('textarea[placeholder="Type in Spanish..."]'),
    ).toBeVisible();

    // Starter message should appear
    await expect(page.locator("text=¡Hola!").first()).toBeVisible();
  });

  test("sends message and receives mocked response", async ({ page }) => {
    // Mock the /api/chat endpoint with a fake SSE stream
    await page.route("**/api/chat", async (route) => {
      const sseData = [
        'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_mock","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-6","usage":{"input_tokens":100,"output_tokens":0}}}\n\n',
        'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"¡Hola! "}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"¿Cómo estás?"}}\n\n',
        'event: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\n',
        'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":10}}\n\n',
        'event: message_stop\ndata: {"type":"message_stop"}\n\n',
      ];

      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: sseData.join(""),
      });
    });

    await page.goto("/chat");

    const url = page.url();
    if (url.includes("/login")) return;

    // Start a free conversation
    await page.locator("text=Free Conversation").click();
    await expect(page.locator("text=End Chat")).toBeVisible();

    // Type and send a message
    const input = page.locator('textarea[placeholder="Type in Spanish..."]');
    await input.fill("Hola, estoy bien");
    await page.locator('button[aria-label="Send message"]').click();

    // User message should appear
    await expect(page.locator("text=Hola, estoy bien")).toBeVisible();

    // Mocked assistant response should stream in
    await expect(page.locator("text=¿Cómo estás?")).toBeVisible({
      timeout: 5000,
    });
  });

  test("end chat returns to situation picker", async ({ page }) => {
    // Mock extraction to avoid real API calls
    await page.route("**/api/chat", (route) =>
      route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_mock","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-6","usage":{"input_tokens":10,"output_tokens":0}}}\n\nevent: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Respuesta"}}\n\nevent: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\nevent: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":5}}\n\nevent: message_stop\ndata: {"type":"message_stop"}\n\n',
      }),
    );

    await page.goto("/chat");

    const url = page.url();
    if (url.includes("/login")) return;

    // Start session
    await page.locator("text=Free Conversation").click();
    await expect(page.locator("text=End Chat")).toBeVisible();

    // End chat
    await page.locator("text=End Chat").click();

    // Should return to situation picker
    await expect(
      page.locator("text=Choose a conversation scenario"),
    ).toBeVisible({ timeout: 10000 });
  });
});
