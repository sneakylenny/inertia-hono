<script setup lang="ts">
import { Link, router, useForm } from '@inertiajs/vue3'

defineProps<{
  todos: { id: number, text: string, done: boolean }[]
  errors?: Record<string, string>
}>()

const form = useForm({ text: '' })

function submit() {
  form.post('/todos', { preserveScroll: true })
}

function partialReloadTodos() {
  router.get('/todos', {}, { only: ['todos'], preserveState: true, preserveScroll: true })
}

async function simulateDbWrite() {
  await fetch('/api/todos/push', { method: 'POST' })
}

function toggle(id: number) {
  router.post(`/todos/${id}/toggle`, {}, { preserveScroll: true })
}

function del(id: number) {
  router.delete(`/todos/${id}`, { preserveScroll: true })
}
</script>

<template>
  <div class="container mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Todos
    </h1>
    <form
      class="mt-6 flex flex-col gap-2"
      @submit.prevent="submit"
    >
      <div class="join w-full max-w-xl">
        <label
          class="sr-only"
          for="todo-text"
        >New todo</label>
        <input
          id="todo-text"
          v-model="form.text"
          class="input input-bordered join-item flex-1"
          type="text"
          name="text"
          placeholder="What needs doing?"
        >
        <button
          type="submit"
          class="btn btn-primary join-item"
          :disabled="form.processing"
        >
          Add
        </button>
      </div>
      <span
        v-if="errors?.text"
        class="text-sm text-error"
      >{{ errors.text }}</span>
    </form>
    <div class="mt-6 overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table">
        <tbody>
          <tr
            v-for="todo in todos"
            :key="todo.id"
          >
            <td class="w-12">
              <input
                type="checkbox"
                class="checkbox checkbox-primary"
                :checked="todo.done"
                @change="toggle(todo.id)"
              >
            </td>
            <td
              class="max-w-0"
              :class="todo.done ? 'line-through opacity-50' : ''"
            >
              {{ todo.text }}
            </td>
            <td class="w-12 text-right">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-circle text-error"
                aria-label="Delete"
                @click="del(todo.id)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-6 flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="simulateDbWrite"
      >
        + row (fetch)
      </button>
      <button
        type="button"
        class="btn btn-outline btn-sm"
        @click="partialReloadTodos"
      >
        partial reload
      </button>
    </p>
    <Link
      class="btn btn-link px-0 mt-8"
      href="/"
    >
      Home
    </Link>
  </div>
</template>
