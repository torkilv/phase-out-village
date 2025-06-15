import { Stack, Button } from '@chakra-ui/react';

export function LanguageToggle() {
  // Placeholder: always EN selected
  return (
    <Stack direction="row" gap={2}>
      <Button colorScheme="teal" variant="solid" size="sm">EN</Button>
      <Button colorScheme="gray" variant="outline" size="sm">NO</Button>
    </Stack>
  );
} 