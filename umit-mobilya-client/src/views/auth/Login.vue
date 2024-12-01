<template>
  <div class="flex flex-col justify-center w-full max-w-xs m-auto">
    <FText as="h1" class="mb-8 text-center"> Login </FText>

    <form class="flex flex-col gap-5" @submit="submitHandler">
      <FInput type="email" id="email" label="Email" name="email" />

      <div class="relative">
        <FPassword id="password" label="Password" name="password" />
      </div>

      <Button
        :disabled="isSubmitting"
        :loading="isSubmitting"
        type="submit"
        label="Sign In"
        icon="pi pi-user"
        class="w-full"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { string, object } from 'yup';
import { useFToast } from '@/composables/useFToast';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { ERouteNames } from '@/router/routeNames.enum';

const { showSuccessMessage, showErrorMessage } = useFToast();
const router = useRouter();
const authStore = useAuthStore();

const validationSchema = object({
  email: string().email().required().label('Email'),
  password: string().required().label('Password'),
});

const { handleSubmit, isSubmitting, resetForm, defineField } = useForm({
  validationSchema,
});

const submitHandler = handleSubmit(async (values) => {
  try {
    const payload = values as { email: string; password: string };
    await authStore.login(payload);
    router.push({ name: ERouteNames.ProductsList });
    showSuccessMessage('Logged in!');
  } catch (error: any) {
    showErrorMessage(error as any);
  }
});
</script>
