import type { Meta, StoryObj } from '@storybook/react'
import PlatformButton, { ColoredPlatformButton, IconOnlyPlatformButton } from './PlatformButton'
import { platforms } from '../config/platforms'

const meta = {
  title: 'Components/PlatformButton',
  component: PlatformButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['inline', 'modal', 'fab'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showLabel: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof PlatformButton>

export default meta
type Story = StoryObj<typeof meta>

// Default story with Spotify platform
export const Default: Story = {
  args: {
    platform: platforms.spotify,
    mode: 'inline',
    size: 'md',
    showLabel: true,
  },
}

// Modal mode variant
export const ModalMode: Story = {
  args: {
    platform: platforms.apple,
    mode: 'modal',
    size: 'lg',
    showLabel: true,
  },
}

// FAB mode variant
export const FabMode: Story = {
  args: {
    platform: platforms.instagram,
    mode: 'fab',
    size: 'sm',
    showLabel: false,
  },
}

// Small size variant
export const SmallSize: Story = {
  args: {
    platform: platforms.facebook,
    mode: 'inline',
    size: 'sm',
    showLabel: true,
  },
}

// Large size variant
export const LargeSize: Story = {
  args: {
    platform: platforms.twitter,
    mode: 'inline',
    size: 'lg',
    showLabel: true,
  },
}

// Without label
export const WithoutLabel: Story = {
  args: {
    platform: platforms.youtube,
    mode: 'inline',
    size: 'md',
    showLabel: false,
  },
}

// Colored variant
export const Colored: Story = {
  render: (args) => <ColoredPlatformButton {...args} />,
  args: {
    platform: platforms.spotify,
    mode: 'inline',
    size: 'md',
    showLabel: true,
  },
}

// Icon only variant
export const IconOnly: Story = {
  render: (args) => <IconOnlyPlatformButton {...args} />,
  args: {
    platform: platforms.apple,
    mode: 'inline',
    size: 'md',
    showLabel: false,
  },
}

// All platforms showcase
export const AllPlatforms: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {Object.values(platforms).map((platform) => (
        <PlatformButton
          key={platform.id}
          platform={platform}
          mode="inline"
          size="md"
          showLabel={true}
        />
      ))}
    </div>
  ),
}

// Dark mode test
export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  args: {
    platform: platforms.spotify,
    mode: 'inline',
    size: 'md',
    showLabel: true,
  },
}

// Focus state test
export const FocusState: Story = {
  args: {
    platform: platforms.apple,
    mode: 'inline',
    size: 'md',
    showLabel: true,
  },
  parameters: {
    pseudo: {
      focus: true,
    },
  },
}

// Hover state test
export const HoverState: Story = {
  args: {
    platform: platforms.instagram,
    mode: 'inline',
    size: 'md',
    showLabel: true,
  },
  parameters: {
    pseudo: {
      hover: true,
    },
  },
}

// Accessibility test with different labels
export const Accessibility: Story = {
  args: {
    platform: platforms.facebook,
    mode: 'inline',
    size: 'md',
    showLabel: true,
    'aria-label': 'Connect with Facebook social media',
  },
}

// Reduced motion variant
export const ReducedMotion: Story = {
  parameters: {
    prefersReducedMotion: 'reduce',
  },
  args: {
    platform: platforms.twitter,
    mode: 'inline',
    size: 'md',
    showLabel: true,
  },
}