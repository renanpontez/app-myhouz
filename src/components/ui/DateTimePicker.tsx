import { useState } from "react";
import { View, Text, Pressable, Platform, Modal } from "react-native";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/styles/colors";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: "date" | "datetime";
  label?: string;
  minimumDate?: Date;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  mode = "datetime",
  label,
  minimumDate,
  placeholder,
}: DateTimePickerProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date>(value ?? new Date());

  const displayValue = value
    ? mode === "date"
      ? format(value, "PPP")
      : format(value, "PPP 'at' HH:mm")
    : null;

  const openPicker = () => {
    setTempDate(value ?? new Date());
    setStep("date");
    setShow(true);
  };

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (!selectedDate) {
      if (Platform.OS === "android") setShow(false);
      return;
    }

    if (Platform.OS === "android") {
      if (mode === "datetime" && step === "date") {
        setTempDate(selectedDate);
        setStep("time");
        return;
      }
      setShow(false);
      onChange(selectedDate);
      return;
    }

    // iOS: inline update
    setTempDate(selectedDate);
  };

  const handleIOSConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  // Android: show native dialogs
  if (Platform.OS === "android") {
    return (
      <View>
        {label && (
          <Text className="text-sm text-muted-foreground mb-1.5">{label}</Text>
        )}
        <Pressable
          className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl px-4 py-3.5 flex-row items-center justify-between"
          onPress={openPicker}
        >
          <Text
            className={
              displayValue
                ? "text-foreground dark:text-foreground-dark"
                : "text-muted-foreground"
            }
          >
            {displayValue ?? placeholder ?? "Select..."}
          </Text>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.muted.foreground}
          />
        </Pressable>
        {show && (
          <RNDateTimePicker
            value={tempDate}
            mode={step}
            display="default"
            minimumDate={minimumDate}
            onChange={handleChange}
          />
        )}
      </View>
    );
  }

  // iOS: show in a bottom modal with spinner
  return (
    <View>
      {label && (
        <Text className="text-sm text-muted-foreground mb-1.5">{label}</Text>
      )}
      <Pressable
        className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl px-4 py-3.5 flex-row items-center justify-between"
        onPress={openPicker}
      >
        <Text
          className={
            displayValue
              ? "text-foreground dark:text-foreground-dark"
              : "text-muted-foreground"
          }
        >
          {displayValue ?? placeholder ?? "Select..."}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={colors.muted.foreground}
        />
      </Pressable>

      <Modal
        visible={show}
        transparent
        animationType="slide"
        onRequestClose={() => setShow(false)}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => setShow(false)} />
        <View className="bg-card dark:bg-card-dark rounded-t-3xl pb-10">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <Pressable onPress={() => setShow(false)}>
              <Text className="text-primary text-base">Cancel</Text>
            </Pressable>
            <Pressable onPress={handleIOSConfirm}>
              <Text className="text-primary text-base font-semibold">Done</Text>
            </Pressable>
          </View>
          <RNDateTimePicker
            value={tempDate}
            mode={mode === "datetime" ? "datetime" : "date"}
            display="spinner"
            minimumDate={minimumDate}
            onChange={handleChange}
          />
        </View>
      </Modal>
    </View>
  );
}
