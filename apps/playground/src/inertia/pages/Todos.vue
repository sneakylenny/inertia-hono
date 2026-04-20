<script setup lang="ts">
import { Head, router, useForm } from '@inertiajs/vue3'
import { computed } from 'vue'

import { MAX_TODO_TEXT_LENGTH, MAX_TODOS } from '../../app/demos/todo/todo.validation'

type PageTodo = { id: number, text: string, done: boolean }

const props = defineProps<{
  todos: PageTodo[]
}>()

const atLimit = computed(() => props.todos.length >= MAX_TODOS)

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
  <Head title="Todos" />
  <div class="container mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-bold">
      Todos
    </h1>
    <form
      class="mt-6 flex flex-col gap-2"
      @submit.prevent="submit"
    >
      <div class="join join-vertical w-full max-w-xl sm:join-horizontal">
        <label
          class="sr-only"
          for="todo-text"
        >New todo</label>
        <input
          id="todo-text"
          v-model="form.text"
          class="input input-bordered join-item min-h-11 w-full flex-1 sm:min-h-0"
          type="text"
          name="text"
          placeholder="What needs doing?"
          :maxlength="MAX_TODO_TEXT_LENGTH"
          :disabled="atLimit || form.processing"
        >
        <button
          type="submit"
          class="btn btn-primary join-item min-h-11 shrink-0 sm:min-h-0"
          :disabled="atLimit || form.processing"
        >
          Add
        </button>
      </div>
      <p class="text-sm text-base-content/70">
        {{ props.todos.length }} / {{ MAX_TODOS }} todos · up to {{ MAX_TODO_TEXT_LENGTH }} characters per todo
      </p>
      <span
        v-if="form.errors.text"
        class="text-sm text-error"
      >{{ form.errors.text }}</span>
      <span
        v-else-if="atLimit"
        class="text-sm text-warning"
      >Todo limit reached — delete one to add more.</span>
    </form>
    <div class="mt-6 overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table">
        <tbody>
          <tr
            v-for="todo in props.todos"
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
    <p class="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        class="btn btn-outline btn-sm w-full sm:w-auto"
        @click="simulateDbWrite"
      >
        + row (background write)
      </button>
      <button
        type="button"
        class="btn btn-outline btn-sm w-full sm:w-auto"
        @click="partialReloadTodos"
      >
        partial reload
      </button>
    </p>
  </div>
</template>
