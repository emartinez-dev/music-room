import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  variant?: "light" | "dark";
  autoFocus?: boolean;
};

export function SearchInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = "What do you want to listen to?",
  variant = "light",
  autoFocus,
}: SearchInputProps) {
  const light = variant === "light";
  const foreground = light ? colors.black : colors.text;

  return (
    <View style={[styles.container, { backgroundColor: light ? colors.text : colors.highlight }]}>
      <Ionicons name="search" size={22} color={light ? colors.highlight : colors.textSubdued} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={light ? "#535353" : colors.textSubdued}
        accessibilityLabel="Search"
        selectionColor={colors.greenDark}
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
        style={[styles.input, { color: foreground }]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close" size={22} color={foreground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "500", paddingVertical: 0 },
});
