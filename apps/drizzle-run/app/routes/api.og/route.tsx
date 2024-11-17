import {
  cachified,
  type CacheEntry,
  type Cache,
  totalTtl,
} from "@epic-web/cachified";
import { ImageResponse } from "@vercel/og";
import { LRUCache } from "lru-cache";

import { serverDb } from "~/database/.server/db";
import type { PlaygroundId } from "~/database/types";
import { env } from "~/utils/env";

const lruInstance = new LRUCache<string, CacheEntry>({ max: 1000 });
const lru: Cache = {
  set(key, value) {
    const ttl = totalTtl(value?.metadata);
    return lruInstance.set(key, value, {
      ttl: ttl === Infinity ? undefined : ttl,
      start: value?.metadata?.createdTime,
    });
  },
  get(key) {
    return lruInstance.get(key);
  },
  delete(key) {
    return lruInstance.delete(key);
  },
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const playgroundId = url.searchParams.get("playgroundId");
  const updatedAt = url.searchParams.get("updatedAt");
  const origin =
    (url.searchParams.get("o") as
      | "visualizer"
      | "index"
      | "converter"
      | "explore") || "index";

  const [interMedium, interRegular] = await Promise.all([
    cachified({
      key: "font-inter-medium",
      cache: lru,
      async getFreshValue() {
        const result = await fetch(`${env.APP_URL}/fonts/Inter-Medium.ttf`);
        return result.arrayBuffer();
      },
    }),
    cachified({
      key: "font-inter-regular",
      cache: lru,
      async getFreshValue() {
        const result = await fetch(`${env.APP_URL}/fonts/Inter-Regular.ttf`);
        return result.arrayBuffer();
      },
    }),
  ]);

  let key = `og-image-${origin}`;

  if (playgroundId) {
    key = `og-image-${playgroundId}-${updatedAt || "0"}`;
  }

  const response = await cachified({
    key,
    cache: lru,
    async getFreshValue() {
      const playground = playgroundId
        ? await serverDb.query.playground
            .findFirst({
              columns: {
                name: true,
                description: true,
                updatedAt: true,
                dialect: true,
              },
              with: {
                creator: {
                  columns: {
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
              where: (Playground, { eq }) =>
                eq(Playground.id, playgroundId as PlaygroundId),
            })
            .catch(() => null)
        : null;

      let title = playground?.name || "Play with Drizzle";
      title = title.length > 50 ? `${title.slice(0, 50)}...` : title;
      let description =
        playground?.description || "Your journey begins here 🚀";

      if (origin === "visualizer") {
        title = `Visualizer`;
        description = "An other view of your schema";
      }

      if (origin === "converter") {
        title = `Converter`;
        description = "From Drizzle to SQL and SQL to Drizzle";
      }

      if (origin === "explore") {
        title = `Explore`;
        description = "Explore all Drizzle playgrounds";
      }

      if (description) {
        description =
          description.length > 50
            ? `${description.slice(0, 50)}...`
            : description;
      }

      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontFamily: "Inter",
              color: "white",
              background: "black",
              width: "100%",
              height: "100%",
              padding: "60px",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                justifyContent: "center",
                height: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <Drizzle />
                <span
                  style={{
                    color: "#C5F74F",
                    marginLeft: 5,
                    fontSize: 30,
                    marginTop: 6,
                  }}
                >
                  Run
                </span>
                {playground?.dialect && (
                  <span
                    style={{
                      color: "darkgray",
                      marginLeft: 5,
                      fontSize: 30,
                      marginTop: 6,
                    }}
                  >
                    • {playground.dialect}
                  </span>
                )}
              </div>
              <h1
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  lineHeight: 1,
                  fontWeight: 300,
                }}
              >
                {title}
              </h1>
              <h2
                style={{
                  marginTop: 15,
                  fontSize: 40,
                  color: "darkgray",
                  fontWeight: 300,
                }}
              >
                {description}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              {playground?.creator?.avatarUrl && (
                <img
                  alt="avatar"
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 50,
                    marginTop: 20,
                    marginBottom: 20,
                    marginRight: 10,
                  }}
                  src={playground.creator.avatarUrl}
                />
              )}
              {playground?.creator?.username && (
                <span style={{ color: "darkgray", fontSize: 30 }}>
                  @{playground?.creator.username}
                </span>
              )}
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
          fonts: [
            {
              name: "Inter",
              data: interMedium,
              weight: 400,
              style: "normal",
            },
            {
              name: "Inter",
              data: interRegular,
              weight: 300,
              style: "normal",
            },
          ],
        },
      );
    },
    ttl: updatedAt ? undefined : 1 * 60 * 1000, // 1 minute
  });

  return response.clone();
}

function Drizzle() {
  return (
    <svg viewBox="0 0 202 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        width="5.25365"
        height="22.2834"
        rx="2.62683"
        transform="matrix(0.873028 0.48767 -0.497212 0.867629 16.0791 30.3292)"
        fill="#c5f74f"
      />
      <rect
        width="5.25365"
        height="22.2834"
        rx="2.62683"
        transform="matrix(0.873028 0.48767 -0.497212 0.867629 34.3301 19)"
        fill="#c5f74f"
      />
      <rect
        width="5.25365"
        height="22.2834"
        rx="2.62683"
        transform="matrix(0.873028 0.48767 -0.497212 0.867629 62.4131 19.0005)"
        fill="#c5f74f"
      />
      <rect
        width="5.25365"
        height="22.2834"
        rx="2.62683"
        transform="matrix(0.873028 0.48767 -0.497212 0.867629 44.1562 30.3292)"
        fill="#c5f74f"
      />
      <path
        d="M85.96 49.44C84.2533 49.44 82.7467 49.0267 81.44 48.2C80.16 47.3733 79.16 46.1867 78.44 44.64C77.72 43.0933 77.36 41.2667 77.36 39.16C77.36 37.0533 77.72 35.24 78.44 33.72C79.16 32.2 80.16 31.0267 81.44 30.2C82.7467 29.3733 84.2533 28.96 85.96 28.96C87.5067 28.96 88.8667 29.3333 90.04 30.08C91.24 30.8267 92.0533 31.8 92.48 33H92.04V23.52C92.04 22.5067 92.2933 21.7467 92.8 21.24C93.3067 20.7067 94.0533 20.44 95.04 20.44C96 20.44 96.7467 20.7067 97.28 21.24C97.8133 21.7467 98.08 22.5067 98.08 23.52V46.28C98.08 47.2667 97.8133 48.0267 97.28 48.56C96.7733 49.0933 96.04 49.36 95.08 49.36C94.12 49.36 93.3733 49.0933 92.84 48.56C92.3333 48.0267 92.08 47.2667 92.08 46.28V43.56L92.52 45.12C92.1467 46.4267 91.3467 47.48 90.12 48.28C88.92 49.0533 87.5333 49.44 85.96 49.44ZM87.76 44.92C88.64 44.92 89.4 44.7067 90.04 44.28C90.68 43.8533 91.1867 43.2267 91.56 42.4C91.9333 41.5467 92.12 40.4667 92.12 39.16C92.12 37.2133 91.72 35.7867 90.92 34.88C90.12 33.9467 89.0667 33.48 87.76 33.48C86.9067 33.48 86.1467 33.68 85.48 34.08C84.84 34.48 84.3333 35.1067 83.96 35.96C83.6133 36.7867 83.44 37.8533 83.44 39.16C83.44 41.1067 83.84 42.56 84.64 43.52C85.44 44.4533 86.48 44.92 87.76 44.92ZM105.854 49.36C104.841 49.36 104.067 49.0933 103.534 48.56C103.001 48.0267 102.734 47.2667 102.734 46.28V32.08C102.734 31.0933 102.987 30.3467 103.494 29.84C104.027 29.3067 104.761 29.04 105.694 29.04C106.654 29.04 107.387 29.3067 107.894 29.84C108.401 30.3467 108.654 31.0933 108.654 32.08V34.16H108.254C108.574 32.56 109.281 31.32 110.374 30.44C111.467 29.56 112.881 29.0667 114.614 28.96C115.281 28.9067 115.787 29.08 116.134 29.48C116.507 29.8533 116.707 30.48 116.734 31.36C116.787 32.1867 116.614 32.84 116.214 33.32C115.841 33.8 115.201 34.0933 114.294 34.2L113.374 34.28C111.854 34.4133 110.721 34.8533 109.974 35.6C109.254 36.3467 108.894 37.4267 108.894 38.84V46.28C108.894 47.2667 108.627 48.0267 108.094 48.56C107.587 49.0933 106.841 49.36 105.854 49.36ZM122.258 49.32C121.272 49.32 120.512 49.04 119.978 48.48C119.472 47.8933 119.218 47.08 119.218 46.04V32.36C119.218 31.2933 119.472 30.48 119.978 29.92C120.512 29.3333 121.272 29.04 122.258 29.04C123.218 29.04 123.952 29.3333 124.458 29.92C124.992 30.48 125.258 31.2933 125.258 32.36V46.04C125.258 47.08 125.005 47.8933 124.498 48.48C123.992 49.04 123.245 49.32 122.258 49.32ZM122.258 25.76C121.138 25.76 120.272 25.5067 119.658 25C119.072 24.4667 118.778 23.72 118.778 22.76C118.778 21.7733 119.072 21.0267 119.658 20.52C120.272 19.9867 121.138 19.72 122.258 19.72C123.378 19.72 124.232 19.9867 124.818 20.52C125.405 21.0267 125.698 21.7733 125.698 22.76C125.698 23.72 125.405 24.4667 124.818 25C124.232 25.5067 123.378 25.76 122.258 25.76ZM131.602 49C131.015 49 130.522 48.8533 130.122 48.56C129.722 48.24 129.455 47.84 129.322 47.36C129.188 46.88 129.188 46.36 129.322 45.8C129.482 45.24 129.788 44.72 130.242 44.24L140.042 32.48V33.88H131.362C130.642 33.88 130.082 33.68 129.682 33.28C129.282 32.88 129.082 32.3333 129.082 31.64C129.082 30.8933 129.282 30.3333 129.682 29.96C130.082 29.56 130.642 29.36 131.362 29.36H142.922C143.642 29.36 144.215 29.52 144.642 29.84C145.068 30.16 145.348 30.56 145.482 31.04C145.642 31.4933 145.655 32 145.522 32.56C145.415 33.0933 145.135 33.6 144.682 34.08L134.642 46.08V44.52H143.922C145.442 44.52 146.202 45.2667 146.202 46.76C146.202 47.48 146.002 48.04 145.602 48.44C145.202 48.8133 144.642 49 143.922 49H131.602ZM150.82 49C150.234 49 149.74 48.8533 149.34 48.56C148.94 48.24 148.674 47.84 148.54 47.36C148.407 46.88 148.407 46.36 148.54 45.8C148.7 45.24 149.007 44.72 149.46 44.24L159.26 32.48V33.88H150.58C149.86 33.88 149.3 33.68 148.9 33.28C148.5 32.88 148.3 32.3333 148.3 31.64C148.3 30.8933 148.5 30.3333 148.9 29.96C149.3 29.56 149.86 29.36 150.58 29.36H162.14C162.86 29.36 163.434 29.52 163.86 29.84C164.287 30.16 164.567 30.56 164.7 31.04C164.86 31.4933 164.874 32 164.74 32.56C164.634 33.0933 164.354 33.6 163.9 34.08L153.86 46.08V44.52H163.14C164.66 44.52 165.42 45.2667 165.42 46.76C165.42 47.48 165.22 48.04 164.82 48.44C164.42 48.8133 163.86 49 163.14 49H150.82ZM175.439 49.44C173.066 49.44 171.292 48.7867 170.119 47.48C168.946 46.1467 168.359 44.1733 168.359 41.56V23.52C168.359 22.5067 168.612 21.7467 169.119 21.24C169.652 20.7067 170.412 20.44 171.399 20.44C172.359 20.44 173.092 20.7067 173.599 21.24C174.132 21.7467 174.399 22.5067 174.399 23.52V41.32C174.399 42.4133 174.626 43.2267 175.079 43.76C175.559 44.2667 176.186 44.52 176.959 44.52C177.172 44.52 177.372 44.5067 177.559 44.48C177.746 44.4533 177.946 44.44 178.159 44.44C178.586 44.3867 178.879 44.52 179.039 44.84C179.226 45.1333 179.319 45.7333 179.319 46.64C179.319 47.44 179.159 48.0533 178.839 48.48C178.519 48.88 178.026 49.1467 177.359 49.28C177.092 49.3067 176.786 49.3333 176.439 49.36C176.092 49.4133 175.759 49.44 175.439 49.44ZM191.684 49.44C189.364 49.44 187.364 49.0267 185.684 48.2C184.031 47.3467 182.751 46.16 181.844 44.64C180.964 43.0933 180.524 41.28 180.524 39.2C180.524 37.1733 180.951 35.4 181.804 33.88C182.657 32.3333 183.844 31.1333 185.364 30.28C186.911 29.4 188.657 28.96 190.604 28.96C192.017 28.96 193.297 29.2 194.444 29.68C195.591 30.1333 196.577 30.8 197.404 31.68C198.231 32.5333 198.857 33.5867 199.284 34.84C199.711 36.0667 199.924 37.44 199.924 38.96C199.924 39.4667 199.764 39.8533 199.444 40.12C199.124 40.36 198.657 40.48 198.044 40.48H185.484V37.36H195.564L194.924 37.92C194.924 36.8267 194.764 35.92 194.444 35.2C194.124 34.4533 193.657 33.8933 193.044 33.52C192.457 33.1467 191.724 32.96 190.844 32.96C189.857 32.96 189.017 33.1867 188.324 33.64C187.631 34.0933 187.097 34.7467 186.724 35.6C186.351 36.4533 186.164 37.48 186.164 38.68V39C186.164 41.0267 186.631 42.52 187.564 43.48C188.524 44.44 189.937 44.92 191.804 44.92C192.444 44.92 193.177 44.84 194.004 44.68C194.831 44.52 195.604 44.2667 196.324 43.92C196.937 43.6267 197.484 43.5333 197.964 43.64C198.444 43.72 198.817 43.9333 199.084 44.28C199.351 44.6267 199.497 45.0267 199.524 45.48C199.577 45.9333 199.484 46.3867 199.244 46.84C199.004 47.2667 198.604 47.6267 198.044 47.92C197.137 48.4267 196.111 48.8 194.964 49.04C193.844 49.3067 192.751 49.44 191.684 49.44Z"
        fill="currentColor"
      />
    </svg>
  );
}
