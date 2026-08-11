import React, { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { Portal, Modal, Text, TextInput, List, useTheme } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import type { TwentyCompanyItem } from "@/services/planAiApi";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (company: TwentyCompanyItem) => void;
}

/**
 * Searchable Twenty company picker.
 *
 * Shared by the post-recording screen and the transcript detail so both offer
 * the same list: it loads companies immediately (empty query returns the first
 * page) rather than demanding a search term before showing anything.
 */
export const TwentyCompanyPicker: React.FC<Props> = ({ visible, onDismiss, onSelect }) => {
  const theme = useTheme();
  const { api } = useAuth();
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<TwentyCompanyItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !api) return;
    const q = query.trim();
    const handle = setTimeout(
      () => {
        setLoading(true);
        api
          .searchTwentyCompanies(q)
          .then(setCompanies)
          .catch(() => setCompanies([]))
          .finally(() => setLoading(false));
      },
      q ? 350 : 0,
    );
    return () => clearTimeout(handle);
  }, [visible, query, api]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          setQuery("");
          onDismiss();
        }}
        contentContainerStyle={{
          backgroundColor: theme.colors.background,
          padding: 20,
          margin: 20,
          borderRadius: 12,
          maxHeight: "80%",
        }}
      >
        <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: "bold" }}>
          Company in Twenty
        </Text>
        <TextInput
          mode="outlined"
          dense
          autoFocus
          placeholder="Search companies…"
          value={query}
          onChangeText={setQuery}
          left={<TextInput.Icon icon="magnify" />}
        />
        <ScrollView style={{ marginTop: 12 }} keyboardShouldPersistTaps="handled">
          {loading && companies.length === 0 ? (
            <Text style={{ opacity: 0.6, padding: 8 }}>Loading…</Text>
          ) : companies.length === 0 ? (
            <Text style={{ opacity: 0.6, padding: 8 }}>No companies found</Text>
          ) : (
            companies.map((c) => (
              <List.Item
                key={c.id}
                title={c.name}
                description={c.domainName || undefined}
                left={(props) => <List.Icon {...props} icon="office-building" />}
                onPress={() => {
                  setQuery("");
                  onSelect(c);
                }}
              />
            ))
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
};

export default TwentyCompanyPicker;
