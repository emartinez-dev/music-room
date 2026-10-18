import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "@/theme/colors";

import { FadeGradient } from "./ui/FadeGradient";
import { PillButton } from "./ui/PillButton";

type CreateRoomModalProps = {
  visible: boolean;
  isCreating: boolean;
  onCancel: () => void;
  onCreate: (name: string) => void;
};

// Mirrors Spotify's "Give your playlist a name" screen
export function CreateRoomModal({ visible, isCreating, onCancel, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (visible) setName("");
  }, [visible]);

  const handleCreate = () => {
    if (name.trim()) onCreate(name.trim());
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.container}>
        <FadeGradient color="#535353" intensity={0.9} reverse />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
        >
          <Text style={styles.title}>Give your room a name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleCreate}
            placeholder="My room"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Room name"
            selectionColor={colors.green}
            autoFocus
            returnKeyType="done"
            style={styles.input}
          />
          <View style={styles.actions}>
            <PillButton label="Cancel" variant="outline" onPress={onCancel} />
            <PillButton
              label="Create"
              onPress={handleCreate}
              loading={isCreating}
              disabled={!name.trim()}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 32, gap: 32 },
  title: { color: colors.text, fontSize: 26, fontWeight: "700", textAlign: "center" },
  input: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.textSubdued,
    paddingVertical: 8,
  },
  actions: { flexDirection: "row", justifyContent: "center", gap: 16 },
});
