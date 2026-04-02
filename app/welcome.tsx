import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import { useEffect } from "react";

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [scale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Animated.View style={heartStyle}>
            <Text style={[styles.heartIcon, { color: colors.primary }]}>{"❤️"}</Text>
          </Animated.View>
          <Text style={[styles.title, { color: colors.foreground }]}>LoveSync</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Stay connected with your love
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/register")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  heartIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    lineHeight: 24,
  },
  bottomSection: {
    gap: 14,
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
});
