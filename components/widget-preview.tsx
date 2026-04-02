import { Text, View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface WidgetPreviewProps {
  message: string;
  senderName: string;
  timestamp?: string;
}

/**
 * A preview of what the lock screen / home screen widget would look like.
 * This gives users a visual representation of the widget experience.
 */
export function WidgetPreview({ message, senderName, timestamp }: WidgetPreviewProps) {
  const colors = useColors();

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <View style={[styles.widgetContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetIcon}>{"❤️"}</Text>
        <Text style={[styles.widgetAppName, { color: colors.primary }]}>LoveSync</Text>
        {formattedTime ? (
          <Text style={[styles.widgetTime, { color: colors.muted }]}>{formattedTime}</Text>
        ) : null}
      </View>
      <Text style={[styles.widgetMessage, { color: colors.foreground }]} numberOfLines={3}>
        {message}
      </Text>
      <Text style={[styles.widgetSender, { color: colors.muted }]}>
        from {senderName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  widgetContainer: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 8,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  widgetIcon: {
    fontSize: 14,
  },
  widgetAppName: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  widgetTime: {
    fontSize: 12,
  },
  widgetMessage: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
  },
  widgetSender: {
    fontSize: 13,
  },
});
