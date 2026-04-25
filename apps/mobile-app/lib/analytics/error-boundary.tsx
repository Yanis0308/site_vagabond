import { Component, type ErrorInfo, type ReactNode } from "react";
// eslint-disable-next-line no-restricted-imports -- last-resort fallback UI rendered outside the app's UI providers; cannot rely on CustomText
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { themeColors } from "@/components/ui/gluestack-ui-provider/config";

import { recordError } from "./analytics";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void recordError(error, {
      type: "render_error",
      component_stack: info.componentStack ?? "",
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.message}>{"Une erreur est survenue."}</Text>
          <TouchableOpacity onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>{"Réessayer"}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// themeColors is a plain const, not a React context — safe to use here even
// though the boundary renders outside GluestackUIProvider.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: themeColors.background["200"].hex,
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    color: themeColors.black["400"].hex,
  },
  button: {
    backgroundColor: themeColors.primary["500"].hex,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: themeColors.background["50"].hex,
    fontSize: 14,
    fontWeight: "600",
  },
});
