# GTOP AI

GTOP AI is a module that based on AI (OpenAI API) compares CV text and Job Description text to return match percentage.
Match means -- how attached CV relates to given job discription.

## Development

1. Install packages `pnpm i`
2. Start local dev server `pnpm dev`
3. Push changes to main branch
4. See updated result at https://gtop-ai.mnik01.workers.dev/

## Tests

Run unit tests with `pnpm test` or `pnpm test:ui`

## Pitfalls

~ 3.3s to execute
~ Limited input text sizes
~ Need more sample data to train
~ Need to add caching
