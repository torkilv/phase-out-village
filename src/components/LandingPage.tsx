import { Box, Button, Heading, Text, VStack, HStack, Container } from '@chakra-ui/react';
import { LanguageToggle } from './LanguageToggle';
import './LandingPage.css';

export function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <Box minH="100vh" className="landing-page">
      {/* Background with animated gradient */}
      <Box className="landing-background" />
      
      {/* Header with language toggle */}
      <Box position="absolute" top={4} right={4} zIndex={10}>
        <LanguageToggle />
      </Box>

      {/* Main content */}
      <Container maxW="6xl" h="100vh" display="flex" alignItems="center" justifyContent="center" position="relative" zIndex={5}>
        <VStack gap={8} textAlign="center" className="landing-content">
          {/* Title with glow effect */}
          <VStack gap={2}>
            <Heading 
              as="h1" 
              size="4xl" 
              className="landing-title"
              color="white"
              fontWeight="bold"
            >
              Phase Out Village
            </Heading>
            <Text fontSize="lg" color="gray.600" className="landing-subtitle">
              Navigate Norway's Energy Transition
            </Text>
          </VStack>

          {/* Description */}
          <Box maxW="2xl">
            <Text fontSize="xl" color="gray.700" lineHeight="1.6" className="landing-description">
              Explore realistic scenarios for phasing out Norwegian oil and gas production 
              while balancing economic prosperity, energy security, and climate goals.
            </Text>
          </Box>

          {/* Feature highlights */}
          <HStack gap={8} flexWrap="wrap" justify="center" className="landing-features">
            <Box className="feature-card">
              <Text fontSize="2xl" mb={2}>🛢️</Text>
              <Text fontWeight="bold" color="gray.700">Real Data</Text>
              <Text fontSize="sm" color="gray.600">30+ Norwegian oil fields</Text>
            </Box>
            <Box className="feature-card">
              <Text fontSize="2xl" mb={2}>📊</Text>
              <Text fontWeight="bold" color="gray.700">Economic Model</Text>
              <Text fontSize="sm" color="gray.600">Realistic revenue calculations</Text>
            </Box>
            <Box className="feature-card">
              <Text fontSize="2xl" mb={2}>🌍</Text>
              <Text fontWeight="bold" color="gray.700">Climate Goals</Text>
              <Text fontSize="sm" color="gray.600">Paris Agreement targets</Text>
            </Box>
          </HStack>

          {/* Call to action */}
          <VStack gap={4}>
            <Button 
              size="xl" 
              className="play-button"
              onClick={onStart}
              _hover={{ transform: 'translateY(-2px)' }}
              _active={{ transform: 'translateY(0px)' }}
              transition="all 0.2s"
            >
              <Text fontSize="xl" fontWeight="bold">Start Game</Text>
            </Button>
            <Text fontSize="sm" color="gray.500">
              Make decisions that shape Norway's energy future
            </Text>
          </VStack>

          {/* Decorative elements */}
          <Box className="floating-elements">
            <Box className="floating-element element-1">💰</Box>
            <Box className="floating-element element-2">⚡</Box>
            <Box className="floating-element element-3">🌱</Box>
            <Box className="floating-element element-4">🏭</Box>
            <Box className="floating-element element-5">📈</Box>
            <Box className="floating-element element-6">🌊</Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
} 