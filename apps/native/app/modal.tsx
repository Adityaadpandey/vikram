import { Text, View } from "react-native";
import { Container } from "@/components/container";

export default function Modal() {
  return (
    <Container>
      <View className="flex-1 p-6">
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-2xl font-bold text-foreground">Modal</Text>
        </View>
      </View>
    </Container>
  );
}
