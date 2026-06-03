import { Link } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home screen</Text>
      <Text style={styles.text}>Hi {user?.email}</Text>
      <Button title={"Log out"} onPress={() => logout()}></Button>
      <Link href="/about" style={styles.button}>
        Go to About screen
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "stretch",
    justifyContent: "space-around",
  },
  text: {
    color: "#fff",
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#fff",
  },
});
