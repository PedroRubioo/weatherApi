import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as Location from 'expo-location';

interface WeatherData {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    daily_chance_of_rain: number;
    condition: {
      text: string;
      icon: string;
    };
  };
}

interface DailyWeatherData {
  date: string;
  dayOfWeek: string;
  maxTemp: number;
  minTemp: number;
  pop: number;
  condition: string;
  icon: string;
}

const API_KEY = '11e5c5e7fa3a402781b52816252602';

// Traducción de condiciones climáticas
const weatherTranslations: { [key: string]: string } = {
  'Sunny': 'Soleado',
  'Clear': 'Despejado',
  'Partly cloudy': 'Parcialmente nublado',
  'Cloudy': 'Nublado',
  'Overcast': 'Cubierto',
  'Mist': 'Neblina',
  'Patchy rain possible': 'Posibilidad de lluvia',
  'Light rain': 'Lluvia ligera',
  'Moderate rain': 'Lluvia moderada',
  'Heavy rain': 'Lluvia fuerte',
};

const WeatherCard = ({ item }: { item: DailyWeatherData }) => {
  const getBackgroundColor = (temp: number) => {
    if (temp < 20) return '#87CEEB'; // Azul
    if (temp >= 21 && temp <= 30) return '#FFD700'; // Amarillo
    return '#FF8C00'; // Naranja
  };

  return (
    <View style={[styles.card, { backgroundColor: getBackgroundColor(item.maxTemp) }]}>
      <Text style={styles.day}>{item.dayOfWeek}</Text>
      <Text style={styles.date}>{item.date}</Text>
      <Image source={{ uri: `https:${item.icon}` }} style={styles.weatherIcon} />
      <Text style={styles.condition}>{item.condition}</Text>
      <Text style={styles.temp}>🌡️ {item.maxTemp}°C / {item.minTemp}°C</Text>
      <Text style={styles.rain}>🌧️ Probabilidad de lluvia: {item.pop}%</Text>
    </View>
  );
};

const App = () => {
  const [weatherData, setWeatherData] = useState<DailyWeatherData[]>([]);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permiso de ubicación denegado');
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude: lat, longitude: lon } = location.coords;

        const response = await fetch(
          `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&aqi=no&alerts=no&lang=es`
        );

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();

        const today = new Date();
        const processedData: DailyWeatherData[] = data.forecast.forecastday.map((item: WeatherData, index: number) => {
          const dateObj = new Date(item.date + 'T00:00:00');
          const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(dateObj);

          const isToday = dateObj.toDateString() === today.toDateString();

          let dayName = new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            timeZone: 'UTC'
          }).format(dateObj);
          dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

          const condition = weatherTranslations[item.day.condition.text] || item.day.condition.text;

          return {
            date: formattedDate,
            dayOfWeek: index === 0 && isToday ? 'Hoy' : dayName,
            maxTemp: item.day.maxtemp_c,
            minTemp: item.day.mintemp_c,
            pop: item.day.daily_chance_of_rain,
            condition: condition,
            icon: item.day.condition.icon
          };
        });

        setLocationName(data.location.name);
        setWeatherData(processedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={styles.center} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 Pronóstico 5 días - {locationName}</Text>
      <FlatList
        data={weatherData}
        renderItem={({ item }) => <WeatherCard item={item} />}
        keyExtractor={item => item.date}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  list: {
    alignItems: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 10,
    alignItems: 'center',
    width: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  day: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 10,
  },
  weatherIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  condition: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  temp: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 5,
  },
  rain: {
    fontSize: 14,
    color: '#00BFFF',
    marginTop: 5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    flex: 1,
    textAlign: 'center',
    color: 'red',
    padding: 20,
  },
});

export default App;
