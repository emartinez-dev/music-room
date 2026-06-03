import { Button, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login screen</Text>
      <Button title={"Login OK"} onPress={() => login("pepito", "123")}></Button>
      <Button title={"Login KO"} color={"red"} onPress={() => login("pepito", "invalid")}></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    justifyContent: "space-evenly",
  },
  text: {
    color: "#fff",
  },
});
