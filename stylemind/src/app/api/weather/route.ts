import { NextRequest, NextResponse } from 'next/server'
import type { WeatherSummary } from '@/lib/types'

const WMO_CONDITIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return 'Spring'
  if (month >= 6 && month <= 8) return 'Summer'
  if (month >= 9 && month <= 11) return 'Fall'
  return 'Winter'
}

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get('location') || 'New York'

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    )
    const geoData = await geoRes.json()

    if (!geoData.results?.length) {
      return NextResponse.json(defaultWeather(location))
    }

    const { latitude, longitude, name, country_code } = geoData.results[0]
    const displayName = `${name}, ${country_code?.toUpperCase() ?? ''}`

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`
    )
    const weatherData = await weatherRes.json()
    const cw = weatherData.current_weather

    const month = new Date().getMonth() + 1
    const summary: WeatherSummary = {
      temp_f: Math.round(cw.temperature),
      condition: WMO_CONDITIONS[cw.weathercode] ?? 'Clear',
      location: displayName,
      season: getSeason(month),
    }

    return NextResponse.json(summary)
  } catch {
    return NextResponse.json(defaultWeather(location))
  }
}

function defaultWeather(location: string): WeatherSummary {
  const month = new Date().getMonth() + 1
  return { temp_f: 72, condition: 'Clear sky', location, season: getSeason(month) }
}
