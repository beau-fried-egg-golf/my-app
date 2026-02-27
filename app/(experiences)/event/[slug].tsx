import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontWeights } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useExperienceStore } from '@/data/experienceStore';
import { useStore } from '@/data/store';
import { supabase } from '@/data/supabase';
import type {
  Event,
  EventTicketType,
  EventAddOnGroup,
  EventAddOn,
  EventFormField,
} from '@/types/experiences';
import LetterSpacedHeader from '@/components/LetterSpacedHeader';

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function EventDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { getEvent } = useExperienceStore();
  const { user, session } = useStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<EventTicketType[]>([]);
  const [addOnGroups, setAddOnGroups] = useState<EventAddOnGroup[]>([]);
  const [addOns, setAddOns] = useState<EventAddOn[]>([]);
  const [formFields, setFormFields] = useState<EventFormField[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketQty, setTicketQty] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [accessCode, setAccessCode] = useState('');

  // Booking form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getEvent(slug).then(result => {
      if (result) {
        setEvent(result.event);
        setTicketTypes(result.ticket_types);
        setAddOnGroups(result.add_on_groups);
        setAddOns(result.add_ons);
        setFormFields(result.form_fields);
      }
      setLoading(false);
    });
  }, [slug]);

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      const names = (user.name || '').split(' ');
      setFirstName(names[0] || '');
      setLastName(names.slice(1).join(' ') || '');
    }
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [user, session]);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId);

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const copy = { ...prev };
      if (copy[addOnId]) {
        delete copy[addOnId];
      } else {
        copy[addOnId] = 1;
      }
      return copy;
    });
  };

  const setAddOnQty = (addOnId: string, qty: number) => {
    if (qty <= 0) {
      setSelectedAddOns(prev => {
        const copy = { ...prev };
        delete copy[addOnId];
        return copy;
      });
    } else {
      setSelectedAddOns(prev => ({ ...prev, [addOnId]: qty }));
    }
  };

  const totalPrice = (() => {
    let total = 0;
    if (selectedTicket) total += selectedTicket.price * ticketQty;
    for (const [aoId, qty] of Object.entries(selectedAddOns)) {
      const ao = addOns.find(a => a.id === aoId);
      if (ao) total += ao.price * qty;
    }
    return total;
  })();

  const isRegistrationOpen = (() => {
    if (!event) return false;
    const now = new Date();
    if (event.registration_opens_at && new Date(event.registration_opens_at) > now) return false;
    if (event.registration_closes_at && new Date(event.registration_closes_at) < now) return false;
    return true;
  })();

  const handleSubmit = async () => {
    if (!event || !selectedTicketId || !firstName || !lastName || !email) {
      Alert.alert('Missing Info', 'Please select a ticket and fill in your name and email.');
      return;
    }

    // Check required form fields
    for (const field of formFields) {
      if (field.required && !formResponses[field.id]?.trim()) {
        Alert.alert('Missing Info', `Please fill in "${field.label}".`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const addOnIds = Object.keys(selectedAddOns);
      const addOnQuantities = addOnIds.map(id => selectedAddOns[id]);

      const { data, error } = await supabase.functions.invoke('create-event-booking', {
        body: {
          event_id: event.id,
          ticket_type_id: selectedTicketId,
          add_on_ids: addOnIds,
          add_on_quantities: addOnQuantities,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          quantity: ticketQty,
          access_code: accessCode || undefined,
          form_responses: formFields.map(f => ({
            field_id: f.id,
            value: formResponses[f.id] || '',
          })).filter(r => r.value),
        },
      });

      if (error) throw error;

      if (data.error === 'invalid_access_code') {
        Alert.alert('Invalid Code', data.detail || 'The access code is incorrect.');
        return;
      }

      if (data.error) {
        Alert.alert('Booking Failed', data.error);
        return;
      }

      if (data.free) {
        Alert.alert('Confirmed!', 'Your booking has been confirmed.', [{ text: 'OK', onPress: goBack }]);
        return;
      }

      if (data.checkout_url) {
        await Linking.openURL(data.checkout_url);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !event) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ textAlign: 'center', marginTop: 100, color: Colors.gray }}>Loading...</Text>
      </View>
    );
  }

  const soldOut = event.spots_remaining != null && event.spots_remaining <= 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero with back button overlay */}
        <View>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              <Ionicons name="calendar-outline" size={48} color={Colors.gray} />
            </View>
          )}
          <View style={styles.backBtnOverlay}>
            <Pressable onPress={goBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color={Colors.white} />
            </Pressable>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.infoSection}>
          <View style={{ marginBottom: 10 }}>
            <LetterSpacedHeader text={event.name} size={26} variant="experiences" />
          </View>

          <Text style={styles.dateText}>
            <Ionicons name="calendar-outline" size={14} color={Colors.gray} /> {formatEventDate(event.date)}
          </Text>
          {event.time && (
            <Text style={styles.metaText}>
              <Ionicons name="time-outline" size={14} color={Colors.gray} /> {formatTime(event.time)}
            </Text>
          )}
          {event.location && (
            <Text style={styles.metaText}>
              <Ionicons name="location-outline" size={14} color={Colors.gray} /> {event.location}
            </Text>
          )}

          {/* Status */}
          <View style={[
            styles.statusBadge,
            soldOut ? styles.statusSoldOut : !isRegistrationOpen ? styles.statusClosed : styles.statusOpen,
          ]}>
            <Text style={styles.statusText}>
              {soldOut
                ? 'Sold Out'
                : !isRegistrationOpen
                  ? 'Registration Closed'
                  : `${event.spots_remaining} spot${event.spots_remaining === 1 ? '' : 's'} remaining`}
            </Text>
          </View>

          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
        </View>

        {/* Ticket Types */}
        {isRegistrationOpen && !soldOut && ticketTypes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            {ticketTypes.map(tt => {
              const isSelected = selectedTicketId === tt.id;
              const unavailable = !tt.on_sale || (tt.available != null && tt.available <= 0);
              return (
                <Pressable
                  key={tt.id}
                  style={[
                    styles.ticketCard,
                    isSelected && styles.ticketCardSelected,
                    unavailable && styles.ticketCardDisabled,
                  ]}
                  onPress={() => {
                    if (unavailable) return;
                    setSelectedTicketId(isSelected ? null : tt.id);
                    setTicketQty(1);
                    setAccessCode('');
                  }}
                  disabled={unavailable}
                >
                  <View style={styles.ticketCardHeader}>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketName}>{tt.name}</Text>
                      {tt.description && (
                        <Text style={styles.ticketDesc}>{tt.description}</Text>
                      )}
                    </View>
                    <Text style={styles.ticketPrice}>{formatPrice(tt.price)}</Text>
                  </View>
                  {unavailable && (
                    <Text style={styles.unavailableText}>
                      {tt.sale_status === 'not_started' ? 'Not yet on sale' : tt.sale_status === 'ended' ? 'Sale ended' : 'Sold out'}
                    </Text>
                  )}
                  {isSelected && !unavailable && (
                    <View style={styles.qtyRow}>
                      {tt.requires_code && (
                        <TextInput
                          style={styles.codeInput}
                          placeholder="Access code"
                          placeholderTextColor={Colors.gray}
                          value={accessCode}
                          onChangeText={setAccessCode}
                          autoCapitalize="none"
                        />
                      )}
                      <Text style={styles.qtyLabel}>Qty:</Text>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => setTicketQty(Math.max(1, ticketQty - 1))}
                      >
                        <Ionicons name="remove" size={16} color={Colors.black} />
                      </Pressable>
                      <Text style={styles.qtyValue}>{ticketQty}</Text>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => {
                          const max = tt.available != null ? tt.available : 10;
                          setTicketQty(Math.min(max, ticketQty + 1));
                        }}
                      >
                        <Ionicons name="add" size={16} color={Colors.black} />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Add-Ons */}
        {isRegistrationOpen && !soldOut && selectedTicketId && addOns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add-Ons</Text>
            {addOnGroups.length > 0 ? (
              addOnGroups.map(group => {
                const groupAddOns = addOns.filter(a => a.add_on_group_id === group.id);
                if (groupAddOns.length === 0) return null;
                return (
                  <View key={group.id} style={styles.addOnGroupBlock}>
                    <Text style={styles.addOnGroupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.addOnGroupDesc}>{group.description}</Text>
                    )}
                    {groupAddOns.map(ao => renderAddOn(ao))}
                  </View>
                );
              })
            ) : (
              addOns.map(ao => renderAddOn(ao))
            )}
            {/* Ungrouped add-ons */}
            {addOnGroups.length > 0 && (() => {
              const ungrouped = addOns.filter(a => !a.add_on_group_id);
              if (ungrouped.length === 0) return null;
              return ungrouped.map(ao => renderAddOn(ao));
            })()}
          </View>
        )}

        {/* Custom Form Fields */}
        {isRegistrationOpen && !soldOut && selectedTicketId && formFields.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Info</Text>
            {formFields.map(field => (
              <View key={field.id} style={styles.formFieldBlock}>
                <Text style={styles.formLabel}>
                  {field.label}{field.required ? ' *' : ''}
                </Text>
                {field.type === 'textarea' ? (
                  <TextInput
                    style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                    multiline
                    value={formResponses[field.id] || ''}
                    onChangeText={v => setFormResponses(prev => ({ ...prev, [field.id]: v }))}
                    placeholderTextColor={Colors.gray}
                  />
                ) : field.type === 'select' && field.options ? (
                  <View style={styles.selectRow}>
                    {field.options.map(opt => (
                      <Pressable
                        key={opt}
                        style={[
                          styles.selectOption,
                          formResponses[field.id] === opt && styles.selectOptionSelected,
                        ]}
                        onPress={() => setFormResponses(prev => ({ ...prev, [field.id]: opt }))}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          formResponses[field.id] === opt && styles.selectOptionTextSelected,
                        ]}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : field.type === 'checkbox' ? (
                  <Pressable
                    style={styles.checkboxRow}
                    onPress={() => setFormResponses(prev => ({
                      ...prev,
                      [field.id]: prev[field.id] === 'yes' ? '' : 'yes',
                    }))}
                  >
                    <Ionicons
                      name={formResponses[field.id] === 'yes' ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={Colors.black}
                    />
                    <Text style={styles.checkboxLabel}>{field.label}</Text>
                  </Pressable>
                ) : (
                  <TextInput
                    style={styles.formInput}
                    value={formResponses[field.id] || ''}
                    onChangeText={v => setFormResponses(prev => ({ ...prev, [field.id]: v }))}
                    placeholderTextColor={Colors.gray}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Booking Form */}
        {isRegistrationOpen && !soldOut && selectedTicketId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Info</Text>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>First Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor={Colors.gray}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Last Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor={Colors.gray}
                />
              </View>
            </View>
            <Text style={styles.formLabel}>Email *</Text>
            <TextInput
              style={styles.formInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.gray}
            />
            <Text style={styles.formLabel}>Phone</Text>
            <TextInput
              style={styles.formInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.gray}
            />
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      {isRegistrationOpen && !soldOut && selectedTicketId && (
        <View style={[styles.ctaBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <View>
            <Text style={styles.ctaPrice}>{formatPrice(totalPrice)}</Text>
            <Text style={styles.ctaPer}>{ticketQty} ticket{ticketQty > 1 ? 's' : ''}</Text>
          </View>
          <Pressable
            style={[styles.ctaButton, submitting && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.ctaButtonText}>
              {submitting ? 'Processing...' : totalPrice === 0 ? 'Register' : 'Get Tickets'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  function renderAddOn(ao: EventAddOn) {
    const aoSelected = !!selectedAddOns[ao.id];
    const aoUnavailable = ao.available != null && ao.available <= 0;
    return (
      <Pressable
        key={ao.id}
        style={[
          styles.addOnCard,
          aoSelected && styles.addOnCardSelected,
          aoUnavailable && styles.ticketCardDisabled,
        ]}
        onPress={() => !aoUnavailable && toggleAddOn(ao.id)}
        disabled={aoUnavailable}
      >
        <View style={styles.ticketCardHeader}>
          <Ionicons
            name={aoSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color={aoUnavailable ? Colors.lightGray : Colors.black}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketName}>{ao.name}</Text>
            {ao.description && (
              <Text style={styles.ticketDesc}>{ao.description}</Text>
            )}
          </View>
          <Text style={styles.ticketPrice}>{formatPrice(ao.price)}</Text>
        </View>
        {aoSelected && !aoUnavailable && (
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Qty:</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => setAddOnQty(ao.id, (selectedAddOns[ao.id] || 1) - 1)}
            >
              <Ionicons name="remove" size={16} color={Colors.black} />
            </Pressable>
            <Text style={styles.qtyValue}>{selectedAddOns[ao.id] || 1}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => {
                const max = ao.available != null ? ao.available : 10;
                setAddOnQty(ao.id, Math.min(max, (selectedAddOns[ao.id] || 1) + 1));
              }}
            >
              <Ionicons name="add" size={16} color={Colors.black} />
            </Pressable>
          </View>
        )}
        {aoUnavailable && (
          <Text style={styles.unavailableText}>Sold out</Text>
        )}
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  backBtnOverlay: {
    position: 'absolute', top: 12, left: 16, zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 120 },
  hero: { width: '100%', height: 240 },
  heroPlaceholder: { backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },

  infoSection: { padding: 16 },
  dateText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 4 },
  metaText: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  statusBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginTop: 12,
  },
  statusOpen: { backgroundColor: '#D4EDDA' },
  statusSoldOut: { backgroundColor: '#F8D7DA' },
  statusClosed: { backgroundColor: '#FFF3CD' },
  statusText: {
    fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.darkGray,
  },
  description: {
    fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray, marginTop: 16, lineHeight: 20,
  },

  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: {
    fontSize: 17, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 12,
  },

  // Ticket cards
  ticketCard: {
    borderWidth: 1.5, borderColor: Colors.lightGray, borderRadius: 12, padding: 14, marginBottom: 10,
  },
  ticketCardSelected: { borderColor: Colors.black },
  ticketCardDisabled: { opacity: 0.5 },
  ticketCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.lightGray,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  radioCircleSelected: { borderColor: Colors.black },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.black },
  ticketName: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  ticketDesc: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 2 },
  ticketPrice: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  unavailableText: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray, marginTop: 6 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingLeft: 30 },
  qtyLabel: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 6, backgroundColor: Colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyValue: { fontSize: 16, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, minWidth: 24, textAlign: 'center' },

  codeInput: {
    flex: 1, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8,
    padding: 8, fontSize: 14, fontFamily: Fonts!.sans, color: Colors.black, marginRight: 12,
  },

  // Add-ons
  addOnGroupBlock: { marginBottom: 16 },
  addOnGroupName: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black, marginBottom: 4 },
  addOnGroupDesc: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.gray, marginBottom: 8 },
  addOnCard: {
    borderWidth: 1.5, borderColor: Colors.lightGray, borderRadius: 12, padding: 14, marginBottom: 10,
  },
  addOnCardSelected: { borderColor: Colors.black },

  // Form
  formRow: { flexDirection: 'row', gap: 12 },
  formLabel: {
    fontSize: 13, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.darkGray,
    marginBottom: 4, marginTop: 10,
  },
  formInput: {
    borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 10,
    fontSize: 14, fontFamily: Fonts!.sans, color: Colors.black,
  },
  formFieldBlock: { marginBottom: 4 },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  selectOption: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.lightGray,
  },
  selectOptionSelected: { backgroundColor: Colors.black, borderColor: Colors.black },
  selectOptionText: { fontSize: 13, fontFamily: Fonts!.sans, color: Colors.darkGray },
  selectOptionTextSelected: { color: Colors.white },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  checkboxLabel: { fontSize: 14, fontFamily: Fonts!.sans, color: Colors.darkGray },

  // CTA
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, paddingTop: 12, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: Colors.lightGray,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  ctaPrice: { fontSize: 20, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.black },
  ctaPer: { fontSize: 12, fontFamily: Fonts!.sans, color: Colors.gray },
  ctaButton: {
    backgroundColor: Colors.black, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10,
  },
  ctaButtonText: { fontSize: 15, fontFamily: Fonts!.sansBold, fontWeight: FontWeights.bold, color: Colors.white },
});
