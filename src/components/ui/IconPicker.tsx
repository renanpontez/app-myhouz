import { useState, useMemo } from "react";
import { View, Text, Pressable, Modal, FlatList, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/styles/colors";
import { TASK_ICON_NAMES, getTaskIcon } from "@/utils/task-icons";

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
  label?: string;
}

const COLUMNS = 5;

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return [...TASK_ICON_NAMES];
    const q = search.toLowerCase();
    return TASK_ICON_NAMES.filter((name) => name.includes(q));
  }, [search]);

  const SelectedIcon = value ? getTaskIcon(value) : null;

  const handleSelect = (icon: string | null) => {
    onChange(icon);
    setVisible(false);
    setSearch("");
  };

  return (
    <View>
      {label && (
        <Text className="text-sm text-muted-foreground mb-1.5">{label}</Text>
      )}
      <Pressable
        className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl px-4 py-3.5 flex-row items-center justify-between"
        onPress={() => setVisible(true)}
      >
        <View className="flex-row items-center gap-3">
          {SelectedIcon ? (
            <SelectedIcon size={20} color={colors.primary.DEFAULT} />
          ) : (
            <Ionicons name="apps-outline" size={20} color={colors.muted.foreground} />
          )}
          <Text
            className={
              value
                ? "text-foreground dark:text-foreground-dark"
                : "text-muted-foreground"
            }
          >
            {value ?? t("common.chooseIcon")}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.muted.foreground}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setVisible(false);
          setSearch("");
        }}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => {
            setVisible(false);
            setSearch("");
          }}
        />
        <View className="bg-card dark:bg-card-dark rounded-t-3xl pb-10" style={{ maxHeight: "70%" }}>
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
          </View>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark px-5 mb-3">
            {t("common.chooseIcon")}
          </Text>

          {/* Search */}
          <View className="px-5 mb-3">
            <TextInput
              className="border border-border dark:border-border-dark rounded-xl px-4 py-3 text-foreground dark:text-foreground-dark bg-background dark:bg-background-dark"
              value={search}
              onChangeText={setSearch}
              placeholder={t("common.searchIcons")}
              placeholderTextColor="#64697A"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* "None" option */}
          <Pressable
            className="flex-row items-center px-5 py-3"
            onPress={() => handleSelect(null)}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{
                backgroundColor: !value ? colors.primary.DEFAULT + "18" : "transparent",
                borderWidth: !value ? 2 : 1,
                borderColor: !value ? colors.primary.DEFAULT : colors.border.DEFAULT,
              }}
            >
              <Ionicons name="close" size={20} color={!value ? colors.primary.DEFAULT : colors.muted.foreground} />
            </View>
            <Text className="text-base text-foreground dark:text-foreground-dark">
              {t("common.none")}
            </Text>
            {!value && (
              <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} style={{ marginLeft: "auto" }} />
            )}
          </Pressable>

          {/* Icon Grid */}
          <FlatList
            data={filteredIcons}
            keyExtractor={(item) => item}
            numColumns={COLUMNS}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
            renderItem={({ item: iconName }) => {
              const Icon = getTaskIcon(iconName);
              const isSelected = value === iconName;
              return (
                <Pressable
                  onPress={() => handleSelect(iconName)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? colors.primary.DEFAULT + "18" : "transparent",
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? colors.primary.DEFAULT : colors.border.DEFAULT,
                  }}
                >
                  <Icon size={24} color={isSelected ? colors.primary.DEFAULT : colors.muted.foreground} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View className="items-center py-8">
                <Text className="text-muted-foreground text-sm">
                  {t("common.none")}
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}
