import { useContext, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function LoginScreen() {
  const { login, signup } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //submit form that decides whether to call signup() or login() based on current mode
  const handleSubmit = async () => {
    setError(null);

    if (isSignup) {
      const err = await signup(username, email, password);
      if (err) return setError(err);
      setError("Account created! You can now login.");
      setIsSignup(false);
    } else {
      const err = await login(email, password);
      if (err) return setError(err);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{isSignup ? "Create Account" : "Reporter"}</Text>
        <Text style={styles.subtitle}>
          {isSignup ? "Join our community of reporters" : "Login to stay informed"}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@mail.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {isSignup && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {isSignup ? "Sign Up" : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          setIsSignup(!isSignup);
          setError(null);
        }}>
          <Text style={styles.switch}>
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#205933",
  },

  card: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  title: {
    fontSize: 28,
    textAlign: "center",
    fontWeight: "bold",
    color: "#205933",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },

  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginLeft: 4,
  },

  input: {
    width: "100%",
    padding: 14,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 12,
    color: "#111",
    fontSize: 16,
  },

  button: {
    padding: 16,
    backgroundColor: "#205933",
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
    elevation: 2,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  switch: {
    marginTop: 20,
    textAlign: "center",
    color: "#205933",
    fontWeight: "600",
  },

  error: {
    color: "#E53935",
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "500",
  },

});