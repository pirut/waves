"use node";

import { ConvexError, v } from "convex/values";

import { action } from "./_generated/server";
import { requireAuthenticatedIdentity } from "./lib/auth";

const geocodeResultValidator = v.object({
  displayName: v.string(),
  latitude: v.number(),
  longitude: v.number(),
  addressLine1: v.string(),
  city: v.optional(v.string()),
  region: v.optional(v.string()),
  country: v.string(),
  postalCode: v.optional(v.string()),
});

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
  postcode?: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
};

function normalizeWhitespace(value?: string) {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function toAddressLine1(result: NominatimResult) {
  const address = result.address;
  const route =
    address?.road ??
    address?.pedestrian ??
    address?.footway ??
    address?.neighbourhood ??
    address?.suburb;
  const line1Parts = [address?.house_number, route]
    .map((value) => normalizeWhitespace(value))
    .filter((value) => value.length > 0);

  if (line1Parts.length > 0) {
    return line1Parts.join(" ");
  }

  const normalizedName = normalizeWhitespace(result.name);
  if (normalizedName) {
    return normalizedName;
  }

  const firstDisplaySegment = normalizeWhitespace(result.display_name?.split(",")[0]);
  return firstDisplaySegment;
}

function toCity(address?: NominatimAddress) {
  return normalizeWhitespace(
    address?.city ??
      address?.town ??
      address?.village ??
      address?.municipality ??
      address?.hamlet ??
      address?.county,
  );
}

export const search = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(geocodeResultValidator),
  handler: async (ctx, args) => {
    await requireAuthenticatedIdentity(ctx);

    const query = args.query.trim();
    if (query.length < 3) {
      return [];
    }

    const limit = Math.max(1, Math.min(8, Math.floor(args.limit ?? 5)));

    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.searchParams.set("q", query);
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("addressdetails", "1");
    endpoint.searchParams.set("limit", String(limit));

    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MakeWaves/1.0 (address lookup)",
      },
    });

    if (!response.ok) {
      throw new ConvexError({
        code: "GEOCODING_LOOKUP_FAILED",
        message: "Could not look up that address. Please try again.",
      });
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return [];
    }

    const results: Array<{
      displayName: string;
      latitude: number;
      longitude: number;
      addressLine1: string;
      city?: string;
      region?: string;
      country: string;
      postalCode?: string;
    }> = [];
    const seenCoordinates = new Set<string>();

    for (const item of payload) {
      const candidate = item as NominatimResult;
      const latitude = Number(candidate.lat);
      const longitude = Number(candidate.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        continue;
      }

      const coordinateKey = `${latitude.toFixed(6)}:${longitude.toFixed(6)}`;
      if (seenCoordinates.has(coordinateKey)) {
        continue;
      }

      const displayName = normalizeWhitespace(candidate.display_name);
      const addressLine1 = toAddressLine1(candidate);
      const city = toCity(candidate.address);
      const region = normalizeWhitespace(candidate.address?.state ?? candidate.address?.region);
      const country = normalizeWhitespace(candidate.address?.country);
      const postalCode = normalizeWhitespace(candidate.address?.postcode);

      if (!displayName || !addressLine1 || !country) {
        continue;
      }

      seenCoordinates.add(coordinateKey);
      results.push({
        displayName,
        latitude,
        longitude,
        addressLine1,
        ...(city ? { city } : {}),
        ...(region ? { region } : {}),
        country,
        ...(postalCode ? { postalCode } : {}),
      });
    }

    return results;
  },
});
