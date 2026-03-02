import { useState } from "react";
import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useHouseholdStore } from "@/stores";
import { getInitials, formatDisplayName } from "@/utils/format";
import { colors } from "@/styles/colors";
import type { HouseholdMemberWithProfile } from "@/domain/models";

interface MemberPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
}

function MemberRow({
  member,
  isSelected,
  onPress,
}: {
  member: HouseholdMemberWithProfile | null;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const name = member ? formatDisplayName(member.profile.name) : t("common.unassigned");
  const initials = member ? getInitials(member.profile.name) : "–";

  return (
    <Pressable
      className="flex-row items-center px-5 py-3.5"
      onPress={onPress}
    >
      <View className="w-9 h-9 rounded-full bg-muted dark:bg-muted-dark items-center justify-center mr-3">
        <Text className="text-sm font-semibold text-muted-foreground">
          {initials}
        </Text>
      </View>
      <Text className="flex-1 text-base text-foreground dark:text-foreground-dark">
        {name}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} />
      )}
    </Pressable>
  );
}

export function MemberPicker({ value, onChange, label }: MemberPickerProps) {
  const { t } = useTranslation();
  const { members } = useHouseholdStore();
  const [visible, setVisible] = useState(false);

  const selected = value
    ? members.find((m) => m.user_id === value || m.id === value)
    : null;
  const displayText = selected
    ? formatDisplayName(selected.profile.name)
    : t("common.unassigned");

  const handleSelect = (id: string | null) => {
    onChange(id);
    setVisible(false);
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
        <Text
          className={
            selected
              ? "text-foreground dark:text-foreground-dark"
              : "text-muted-foreground"
          }
        >
          {displayText}
        </Text>
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
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setVisible(false)}
        />
        <View className="bg-card dark:bg-card-dark rounded-t-3xl pb-10">
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
          </View>
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark px-5 mb-2">
            {label ?? t("items.assignedTo")}
          </Text>
          <FlatList
            data={[null, ...members]}
            keyExtractor={(item) => item?.id ?? "unassigned"}
            renderItem={({ item }) => (
              <MemberRow
                member={item}
                isSelected={
                  item === null ? value === null : item.user_id === value
                }
                onPress={() => handleSelect(item?.user_id ?? null)}
              />
            )}
            style={{ maxHeight: 400 }}
          />
        </View>
      </Modal>
    </View>
  );
}
