import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps, useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

import { Touchable } from "./Touchable";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, header, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(400);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 18,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}
      >
        <View style={styles.handle} />
        {header && <View style={styles.header}>{header}</View>}
        {children}
      </Animated.View>
    </Modal>
  );
}

type SheetItemProps = {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export function SheetItem({ icon, label, onPress, destructive }: SheetItemProps) {
  const color = destructive ? colors.danger : colors.text;
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      style={styles.item}
      pressedStyle={styles.itemPressed}
    >
      <Ionicons name={icon} size={24} color={destructive ? colors.danger : colors.textSubdued} />
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "80%",
    backgroundColor: colors.card,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, height: 52 },
  itemPressed: { backgroundColor: colors.highlight },
  itemLabel: { fontSize: 16 },
});
