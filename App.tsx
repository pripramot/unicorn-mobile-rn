import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View, FlatList, Image, TouchableOpacity, Modal, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { supabase } from './lib/supabase';

// Styled Components
const Container = styled(SafeAreaView, 'flex-1 bg-neutral-900');
const Header = styled(View, 'p-4 border-b border-neutral-800');
const Title = styled(Text, 'text-2xl font-bold text-cyan-400');
const Card = styled(TouchableOpacity, 'bg-neutral-800 m-4 p-4 rounded-xl border border-neutral-700');
const CarImage = styled(Image, 'w-full h-48 rounded-lg mb-4 bg-neutral-700');
const CarTitle = styled(Text, 'text-xl font-bold text-white');
const CarPrice = styled(Text, 'text-cyan-400 text-lg mb-2');
const Badge = styled(View, 'bg-neutral-900 px-2 py-1 rounded self-start mb-2');
const BadgeText = styled(Text, 'text-neutral-400 text-xs');

// Types
interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  image_url: string | null;
  status: string;
}

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'available'); // Only show available cars

      if (error) throw error;
      setVehicles(data || []);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function checkAvailability(vehicleId: string) {
    // Hardcoded dates for demo: Next 3 days
    const today = new Date();
    const next3Days = new Date();
    next3Days.setDate(today.getDate() + 3);

    try {
      const { data, error } = await supabase.functions.invoke('check-availability', {
        body: {
          vehicle_id: vehicleId,
          pickup_at: today.toISOString(),
          return_at: next3Days.toISOString(),
        }
      });

      if (error) throw error;

      if (data.available) {
        Alert.alert('✅ Available!', 'This car is free for the next 3 days.');
      } else {
        Alert.alert('❌ Not Available', 'This car is reserved.');
      }
    } catch (e) {
      Alert.alert('Error checking availability', (e as Error).message);
    }
  }

  const renderItem = ({ item }: { item: Vehicle }) => (
    <Card onPress={() => checkAvailability(item.id)}>
      <CarImage
        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1550355291-bbee04a92027' }}
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-start">
        <View>
          <CarTitle>{item.brand} {item.model}</CarTitle>
          <Badge>
            <BadgeText>{item.year}</BadgeText>
          </Badge>
        </View>
        <CarPrice>฿{item.price_per_day}/day</CarPrice>
      </View>
      <Text className="text-neutral-500 mt-2">Tap to check availability</Text>
    </Card>
  );

  return (
    <Container>
      <StatusBar style="light" />
      <Header>
        <Title>🦄 Unicorn Mobile</Title>
        <Text className="text-neutral-500">React Native / Expo</Text>
      </Header>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#22d3ee" />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </Container>
  );
}
