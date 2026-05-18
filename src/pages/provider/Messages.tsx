import Messages from "@/components/Messages";

const ProviderMessages = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Direct Messages</h1>
        <p className="text-muted-foreground text-sm">
          Communicate with local NGOs and rescue teams regarding surplus food deliveries.
        </p>
      </div>
      <Messages />
    </div>
  );
};

export default ProviderMessages;
