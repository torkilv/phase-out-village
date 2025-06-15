import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { LanguageToggle } from './LanguageToggle';

export function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <Box minH="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg="gray.50">
      <VStack gap={6}>
        <Heading as="h1" size="2xl">Phase Out Village</Heading>
        <Text fontSize="xl" textAlign="center">
          Chill, baby! Chill!<br />
          Explore scenarios for phasing out Norwegian oil and gas production.
        </Text>
        {/* Placeholder for inspirational image */}
        <Box boxSize="200px" bg="gray.200" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
          <Text color="gray.500">[Inspirational Image]</Text>
        </Box>
        <Button colorScheme="teal" size="lg" onClick={onStart}>
          Play Game
        </Button>
        <LanguageToggle />
      </VStack>
    </Box>
  );
} 