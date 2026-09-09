import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
    ArrowUpRight,
    Bot,
    BookOpen,
    CheckSquare2,
    Sparkles,
    Target,
} from 'lucide-react-native'

const FEATURES = [
    {
        icon: Target,
        label: 'Goals',
        desc: 'Move the work that matters',
    },
    {
        icon: CheckSquare2,
        label: 'Habits',
        desc: 'Make consistency visible',
    },
    {
        icon: BookOpen,
        label: 'Journal',
        desc: 'Keep the signal from each day',
    },
    {
        icon: Bot,
        label: 'AI coach',
        desc: 'Think clearly with useful prompts',
    },
]

export default function Welcome() {
    const router = useRouter()

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.brand}>
                            <View style={styles.logo}>
                                <Sparkles
                                    size={20}
                                    color="#151515"
                                    strokeWidth={2.4}
                                />
                            </View>

                            <Text style={styles.brandText}>
                                Life OS
                            </Text>
                        </View>

                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                Daily system
                            </Text>
                        </View>
                    </View>

                    {/* Hero */}
                    <View style={styles.hero}>
                        <Text style={styles.eyebrow}>
                            MAKE TODAY COUNT
                        </Text>

                        <Text style={styles.title}>
                            A clearer way to run your life.
                        </Text>

                        <Text style={styles.description}>
                            Plan the day, keep your habits honest, and close the loop before you sleep.
                        </Text>
                    </View>

                    {/* Features */}
                    <View style={styles.toolkit}>
                        <Text style={styles.toolkitTitle}>
                            YOUR DAILY TOOLKIT
                        </Text>

                        <View>
                            {FEATURES.map(({ icon: Icon, label, desc }, index) => (
                                <View
                                    key={label}
                                    style={[
                                        styles.feature,
                                        index !== FEATURES.length - 1 && styles.featureBorder,
                                    ]}
                                >
                                    <View style={styles.featureIcon}>
                                        <Icon
                                            size={18}
                                            color="#D7FF35"
                                            strokeWidth={2.2}
                                        />
                                    </View>

                                    <View style={styles.featureContent}>
                                        <Text style={styles.featureLabel}>
                                            {label}
                                        </Text>

                                        <Text
                                            style={styles.featureDescription}
                                            numberOfLines={1}
                                        >
                                            {desc}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>

                        {/* Start your day */}
                        <Pressable
                            onPress={() => router.push('/morning')}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                pressed && styles.primaryPressed,
                            ]}
                        >
                            <Text style={styles.primaryText}>
                                Start your day
                            </Text>

                            <ArrowUpRight
                                size={20}
                                color="#151515"
                            />
                        </Pressable>

                        {/* Dashboard */}
                        <Pressable
                            onPress={() => router.push('/dashboard')}
                            style={({ pressed }) => [
                                styles.secondaryButton,
                                pressed && styles.secondaryPressed,
                            ]}
                        >
                            <Text style={styles.secondaryText}>
                                Go to dashboard
                            </Text>
                        </Pressable>

                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#141414',
    },

    scrollContent: {
        flexGrow: 1,
        padding: 16,
    },

    card: {
        flex: 1,
        width: '100%',
        maxWidth: 500,
        minHeight: '100%',
        alignSelf: 'center',

        backgroundColor: '#1D1D1D',

        borderRadius: 32,

        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,

        overflow: 'hidden',
    },

    /* Header */

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    brand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    logo: {
        width: 44,
        height: 44,

        borderRadius: 16,

        backgroundColor: '#D7FF35',

        alignItems: 'center',
        justifyContent: 'center',
    },

    brandText: {
        color: '#F4F4F0',

        fontSize: 14,
        fontWeight: '600',

        letterSpacing: -0.15,
    },

    badge: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',

        borderRadius: 999,

        paddingHorizontal: 12,
        paddingVertical: 6,
    },

    badgeText: {
        color: '#92928D',

        fontSize: 11,
        fontWeight: '600',
    },

    /* Hero */

    hero: {
        flex: 1,

        justifyContent: 'center',

        paddingVertical: 56,
    },

    eyebrow: {
        marginBottom: 16,

        color: '#D7FF35',

        fontSize: 12,
        fontWeight: '600',

        letterSpacing: 2.1,
    },

    title: {
        maxWidth: 420,

        color: '#F4F4F0',

        fontSize: 54,
        lineHeight: 50,

        fontWeight: '900',

        letterSpacing: -3,
    },

    description: {
        maxWidth: 340,

        marginTop: 24,

        color: '#92928D',

        fontSize: 16,
        lineHeight: 28,
    },

    /* Toolkit */

    toolkit: {
        backgroundColor: '#F4F4F0',

        borderRadius: 28,

        padding: 12,
    },

    toolkitTitle: {
        paddingHorizontal: 8,
        paddingTop: 4,
        paddingBottom: 12,

        color: '#92928D',

        fontSize: 12,
        fontWeight: '700',

        letterSpacing: 1.9,
    },

    feature: {
        flexDirection: 'row',
        alignItems: 'center',

        gap: 12,

        paddingHorizontal: 8,
        paddingVertical: 14,
    },

    featureBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(21,21,21,0.1)',
    },

    featureIcon: {
        width: 40,
        height: 40,

        flexShrink: 0,

        borderRadius: 14,

        backgroundColor: '#1D1D1D',

        alignItems: 'center',
        justifyContent: 'center',
    },

    featureContent: {
        flex: 1,
        minWidth: 0,
    },

    featureLabel: {
        color: '#151515',

        fontSize: 14,
        fontWeight: '700',
    },

    featureDescription: {
        marginTop: 2,

        color: '#92928D',

        fontSize: 12,
    },

    /* Actions */

    actions: {
        marginTop: 16,

        gap: 8,
    },

    primaryButton: {
        height: 56,

        width: '100%',

        borderRadius: 18,

        backgroundColor: '#D7FF35',

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        gap: 8,
    },

    primaryPressed: {
        transform: [{ scale: 0.985 }],
        opacity: 0.9,
    },

    primaryText: {
        color: '#151515',

        fontSize: 16,
        fontWeight: '700',
    },

    secondaryButton: {
        height: 48,

        width: '100%',

        borderRadius: 16,

        alignItems: 'center',
        justifyContent: 'center',
    },

    secondaryPressed: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        transform: [{ scale: 0.985 }],
    },

    secondaryText: {
        color: '#92928D',

        fontSize: 14,
        fontWeight: '600',
    },
})