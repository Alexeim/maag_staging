# Molecule: Input

A reliable, self-contained input component built with Astro and Alpine.js. It follows the **Blueprint 2: Self-Contained** pattern, managing its own internal state while communicating changes to parent components via events.

## How to Use

Import the component into your Astro page and use it within a parent Alpine component that listens for value changes.

```astro
---
import Input from '@shared-components/molecules/input/Input.astro';

const initialEmail = "user@example.com";
const initialName = "";
---

<div
  class="p-8 bg-base-100"
  x-data=`{
    email: '${initialEmail}',
    fullName: '${initialName}',
    handleValueChange(event) {
      // Update the appropriate field based on the input name
      if (event.detail.name === 'email') {
        this.email = event.detail.value;
      } else if (event.detail.name === 'full-name') {
        this.fullName = event.detail.value;
      }
    }
  }`
  @value-changed.window="handleValueChange($event)"
>
  <h2 class="text-xl mb-4">User Information</h2>

  <Input
    name="email"
    label="Email Address"
    type="email"
    value={initialEmail}
    placeholder="Enter your email"
    required
  />

  <Input
    name="full-name"
    label="Full Name"
    value={initialName}
    placeholder="Enter your full name"
    class="mt-4"
  />

  <div class="mt-4 p-4 bg-gray-100 rounded">
    <p><strong>Email:</strong> <span x-text="email"></span></p>
    <p><strong>Name:</strong> <span x-text="fullName"></span></p>
  </div>
</div>
```

## Props

| Prop           | Type                     | Default     | Description                                                    |
| -------------- | ------------------------ | ----------- | -------------------------------------------------------------- |
| `name`         | `string`                 | **Required**| Name attribute for the input, used in form submissions and events. |
| `value`        | `string \| number`       | **Required**| The initial value of the input.                               |
| `label`        | `string`                 | `undefined` | Optional label text displayed above the input.                |
| `type`         | `string`                 | `"text"`    | HTML input type (text, email, password, number, etc.).        |
| `placeholder`  | `string`                 | `undefined` | Placeholder text for the input.                               |
| `disabled`     | `boolean`                | `false`     | Whether the input is disabled.                                 |
| `required`     | `boolean`                | `false`     | Whether the input is required.                                 |
| `class`        | `string`                 | `""`        | Additional CSS classes for the wrapper div.                   |
| `inputClass`   | `string`                 | `""`        | Additional CSS classes for the input element itself.          |

All other HTML input attributes are supported via `...rest`.

## Events

The component dispatches a `value-changed` event whenever the input value changes.

### Event Detail Structure

```typescript
interface ValueChangedEvent {
  name: string;           // The name of the input that changed
  value: string | number; // The new value
}
```

## Architecture Pattern

This component follows **Blueprint 2: Self-Contained** from the Alpine.js Architecture:

- ✅ **MUST** have an `x-data` attribute with internal state
- ✅ **MUST** use the "Astro-to-Alpine Bridge" pattern (`${JSON.stringify(value)}`)
- ✅ **MUST** use `$dispatch` to report state changes up to parent
- ✅ **MUST** use `$watch` to monitor internal state changes

## Accessibility (A11y)

The component is built with accessibility in mind:
- Proper `<label>` association via `for` attribute and input `id`
- Support for `required`, `disabled`, and other semantic attributes
- Full keyboard navigation support
- Screen reader compatible

## Examples

### Basic Text Input

```astro
<Input
  name="username"
  label="Username"
  value=""
  placeholder="Enter username"
/>
```

### Email Input with Validation

```astro
<Input
  name="email"
  label="Email Address"
  type="email"
  value=""
  placeholder="user@example.com"
  required
/>
```

### Number Input

```astro
<Input
  name="age"
  label="Age"
  type="number"
  value={25}
  min={18}
  max={120}
/>
```

### Password Input

```astro
<Input
  name="password"
  label="Password"
  type="password"
  value=""
  placeholder="Enter secure password"
  required
/>
```

### Custom Styling

```astro
<Input
  name="custom"
  label="Styled Input"
  value=""
  class="my-custom-wrapper"
  inputClass="input-lg input-primary"
/>
```

## Real-World Form Example

```astro
---
import Input from '@shared-components/molecules/input/Input.astro';

const initialData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: ""
};
---

<form
  x-data=`{
    formData: ${JSON.stringify(initialData)},
    handleInput(event) {
      this.formData[event.detail.name] = event.detail.value;
    },
    submit() {
      console.log('Submitting:', this.formData);
      // Handle form submission
    }
  }`
  @value-changed="handleInput($event)"
  @submit.prevent="submit()"
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input
      name="firstName"
      label="First Name"
      value={initialData.firstName}
      required
    />
    
    <Input
      name="lastName"
      label="Last Name"
      value={initialData.lastName}
      required
    />
  </div>

  <Input
    name="email"
    label="Email"
    type="email"
    value={initialData.email}
    class="mt-4"
    required
  />

  <Input
    name="phone"
    label="Phone"
    type="tel"
    value={initialData.phone}
    placeholder="+1 (555) 123-4567"
    class="mt-4"
  />

  <button type="submit" class="btn btn-primary mt-6">
    Submit Form
  </button>
</form>
```

## Integration with Forms

The component works seamlessly with standard HTML forms:

```astro
<!-- The name attribute ensures proper form submission -->
<form method="post" action="/submit">
  <Input name="username" label="Username" value="" />
  <Input name="email" label="Email" type="email" value="" />
  <button type="submit">Submit</button>
</form>
```

## Technical Notes

- **State Management**: Uses internal `internalValue` state that syncs with the DOM
- **Event Timing**: `$watch` triggers after value changes, ensuring parent gets updated values
- **Performance**: Minimal overhead with efficient Alpine.js reactivity
- **Server-Side**: Initial values are baked in during server-side rendering for hydration stability
