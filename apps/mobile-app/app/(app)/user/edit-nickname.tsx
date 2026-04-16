import { ajvResolver } from "@hookform/resolvers/ajv";
import { useDebouncer } from "@tanstack/react-pacer";
import {
  allJsonSchemas,
  NICKNAME_MAX_LENGTH,
  type NicknameUpdate,
  NicknameUpdateSchema,
  slugifyNickname,
} from "@vagabond/shared-utils";
import { type JSONSchemaType } from "ajv";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { CustomText } from "@/components/custom-ui/CustomText";
import { CustomScreenContainer } from "@/components/navigation/CustomScreenContainer";
import { themeColors } from "@/components/ui/gluestack-ui-provider/config";
import { Input, InputField } from "@/components/ui/input";
import { useUpdateNicknameMutation } from "@/hooks/mutations/useUpdateNicknameMutation";
import { useUsersMe } from "@/hooks/queries/useUsersMe";
import { displayingLoaderAtom } from "@/stores/displayingLoaderAtom";
import { cn } from "@/utils/cn";
import { logger } from "@/utils/logger";

const DEBOUNCE_DELAY = 500;

export default function EditNicknameScreen(): ReactElement {
  const { data: currentUser } = useUsersMe();
  const { t } = useTranslation("common");
  const mutation = useUpdateNicknameMutation();
  const setDisplayingLoader = useSetAtom(displayingLoaderAtom);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = useForm<NicknameUpdate>({
    resolver: ajvResolver(
      NicknameUpdateSchema as JSONSchemaType<NicknameUpdate>,
      {
        addUsedSchema: false,
        schemas: allJsonSchemas,
      },
    ),
    defaultValues: { nickname: currentUser?.nickname ?? "" },
    mode: "onChange",
  });

  const nicknameValue = watch("nickname");

  const nicknameDebouncer = useDebouncer(
    (value: string) => {
      setValue("nickname", slugifyNickname(value), { shouldValidate: true });
    },
    { wait: DEBOUNCE_DELAY },
  );

  const onSubmit = async (values: NicknameUpdate): Promise<void> => {
    try {
      setDisplayingLoader(true);
      await mutation.mutateAsync(values.nickname);
      router.back();
    } catch (error) {
      logger("=== EDIT NICKNAME SUBMIT ERROR ===", error);
      throw error;
    } finally {
      setDisplayingLoader(false);
    }
  };

  const handleCancel = (): void => {
    router.back();
  };

  return (
    <CustomScreenContainer
      isLightScreen={true}
      bgColor={themeColors.background["200"].hex}
      withHeader={false}
      isTabScreen={false}
    >
      <View className="flex-row items-center justify-between border-b border-background-300 px-4 py-3">
        <Pressable onPress={handleCancel} className="min-w-20">
          <CustomText className="text-base text-gray-500">
            {t("edit_nickname.cancel")}
          </CustomText>
        </Pressable>
        <CustomText className="text-base font-semibold">
          {t("edit_nickname.title")}
        </CustomText>
        <Pressable
          onPress={(): void => {
            void handleSubmit(onSubmit)();
          }}
          disabled={isSubmitting || !isValid}
          className={cn("min-w-20", (isSubmitting || !isValid) && "opacity-50")}
        >
          <CustomText className="text-right text-base font-semibold text-primary-500">
            {t("edit_nickname.confirm")}
          </CustomText>
        </Pressable>
      </View>
      <View className="gap-1 p-4">
        <Controller
          control={control}
          name="nickname"
          render={({ field: { onBlur, onChange } }): ReactElement => (
            <Input
              variant="outline"
              size="md"
              isInvalid={errors.nickname !== undefined}
              className="rounded-xl bg-background-50"
            >
              <InputField
                value={nicknameValue}
                onChangeText={(text: string) => {
                  onChange(text);
                  nicknameDebouncer.maybeExecute(text);
                }}
                onBlur={onBlur}
                autoFocus
                maxLength={NICKNAME_MAX_LENGTH}
                placeholder={t("edit_nickname.placeholder")}
                placeholderTextColor={themeColors.background["600"].hex}
              />
            </Input>
          )}
        />
        <View className="mt-1 flex-row items-start justify-between gap-2 px-1">
          <View className="flex-1">
            {errors.nickname !== undefined ? (
              <CustomText className="text-sm text-error-500">
                {t("edit_nickname.error")}
              </CustomText>
            ) : (
              <CustomText className="text-xs text-gray-400">
                {t("edit_nickname.format_hint")}
              </CustomText>
            )}
          </View>
          <CustomText className="shrink-0 text-xs text-gray-400">
            {`${nicknameValue.length}/${NICKNAME_MAX_LENGTH.toString()}`}
          </CustomText>
        </View>
      </View>
    </CustomScreenContainer>
  );
}
